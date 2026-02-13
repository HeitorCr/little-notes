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
    if(!text) return;
    
    const { error } = await _supabase.from('little-notes').insert([{
        text: text,
        color: selectedColor,
        rotation: Math.random() * 8 - 4,
        date: new Date().toLocaleDateString('pt-BR')
    }]);

    if(error) {
        console.error("Erro ao salvar:", error);
        alert("Ops! Ocorreu um erro ao salvar seu carinho.");
    } else {
        input.value = '';
        fetchNotes();
    }
}

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
        const div = document.createElement('div');
        div.style.setProperty('--rotation', `${note.rotation}deg`);
        div.className = `note-card p-8 relative group bg-note-${note.color} rounded-sm`;
        div.style.transform = `rotate(${note.rotation}deg)`;
        
        div.innerHTML = `
            <div class="font-hand text-3xl h-full overflow-y-auto pr-2 custom-scrollbar">
                ${note.text}
            </div>
            <div class="flex justify-between items-center mt-4 pt-2 border-t border-black/5 opacity-60">
                <span class="text-xs font-bold uppercase tracking-widest">${note.date}</span>
                <button onclick="deleteNote(${note.id})" class="text-rose-500 hover:scale-125 transition-transform">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
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
