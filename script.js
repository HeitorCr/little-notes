// Substitua pelas suas chaves reais
const SUPABASE_URL = 'https://wjfcwtmqtfoldlsgabnu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZmN3dG1xdGZvbGRsc2dhYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTUzMDMsImV4cCI6MjA4NjU3MTMwM30.2eqwNNR6sNq4lxQYN28yLAh_C8nQQZ9P2IqKAZmUDtA';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedColor = 'yellow';

// Seleção de Cores
document.querySelectorAll('#colorPicker button').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('#colorPicker button').forEach(b => b.classList.remove('border-2', 'border-slate-400'));
        btn.classList.add('border-2', 'border-slate-400');
        selectedColor = btn.dataset.color;
    }
});

// Enviar Nota
async function sendNote() {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    // Captura qual rádio está marcado
    const sender = document.querySelector('input[name="sender"]:checked').value;
    
    if(!text) return;
    
    const { error } = await _supabase.from('little-notes').insert([{
        text: text,
        color: selectedColor,
        sender: sender, // Salvando o nome
        rotation: Math.random() * 8 - 4,
        date: new Date().toLocaleDateString('pt-BR')
    }]);

    if(error) {
        console.error(error);
        alert("Erro ao salvar!");
    } else {
        input.value = '';
        fetchNotes();
    }
}

// E mude a parte do fetchNotes onde o HTML da nota é gerado:
// Procure o div.innerHTML dentro do data.forEach:
div.innerHTML = `
    <div class="font-hand text-3xl h-full overflow-y-auto pr-2 custom-scrollbar">
        ${note.text}
    </div>
    <div class="flex justify-between items-end mt-4 pt-2 border-t border-black/5">
        <span class="text-[10px] uppercase opacity-50 font-bold">${note.date}</span>
        <div class="flex flex-col items-end">
            <span class="sender-tag font-hand text-xl">De: ${note.sender || 'Anônimo'}</span>
            <button onclick="deleteNote(${note.id})" class="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    </div>
`;

// Buscar Notas
async function fetchNotes() {
    const { data, error } = await _supabase.from('little-notes').select('*').order('id', { ascending: false });
    
    if(error) {
        console.error("Erro ao buscar:", error);
        return;
    }

    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    
    data.forEach(note => {
        // Criamos o elemento primeiro para poder configurar as propriedades
        const noteDiv = document.createElement('div');
        
        // Configuração visual
        noteDiv.style.setProperty('--rotation', `${note.rotation}deg`);
        noteDiv.style.transform = `rotate(${note.rotation}deg)`;
        noteDiv.className = `note-card p-8 relative group bg-note-${note.color} rounded-sm shadow-lg`;
        
        // Conteúdo da nota
        noteDiv.innerHTML = `
            <div class="font-hand text-3xl h-full overflow-y-auto pr-2">
                ${note.text}
            </div>
            <div class="flex justify-between items-end mt-4 pt-2 border-t border-black/10">
                <span class="text-[10px] uppercase opacity-50 font-bold">${note.date}</span>
                <div class="flex flex-col items-end">
                    <span class="font-hand text-2xl text-rose-600">De: ${note.sender || 'Amor'}</span>
                    <button onclick="deleteNote(${note.id})" class="text-rose-500 hover:scale-125 transition-transform mt-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(noteDiv);
    });
    
    // Recarrega os ícones da biblioteca Lucide
    lucide.createIcons();
}

async function deleteNote(id) {
    if(confirm("Deseja apagar esse recadinho? 🥺")) {
        await _supabase.from('little-notes').delete().eq('id', id);
        fetchNotes();
    }
}

// Inicialização
fetchNotes();
setInterval(fetchNotes, 10000); // Atualiza a cada 10 segundos
