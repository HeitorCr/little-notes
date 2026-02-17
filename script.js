// MANTENHA SUAS CONFIGURAÇÕES DO SUPABASE AQUI
const SUPABASE_URL = 'https://wjfcwtmqtfoldlsgabnu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZmN3dG1xdGZvbGRsc2dhYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTUzMDMsImV4cCI6MjA4NjU3MTMwM30.2eqwNNR6sNq4lxQYN28yLAh_C8nQQZ9P2IqKAZmUDtA';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedColor = 'yellow';
let selectedFile = null;

// Seleção de Cores
document.querySelectorAll('#colorPicker button').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('#colorPicker button').forEach(b => b.classList.remove('border-2', 'border-slate-400'));
        btn.classList.add('border-2', 'border-slate-400');
        selectedColor = btn.dataset.color;
    }
});

// Lidar com a seleção de arquivo (Preview)
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

// Limpar imagem selecionada
function clearImage() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('imagePreviewContainer').classList.add('hidden');
    document.getElementById('imagePreview').src = '';
}

// Enviar Nota
async function sendNote() {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    const sender = document.querySelector('input[name="sender"]:checked').value;
    const btn = document.getElementById('btnSend');
    
    // Validar se tem texto OU imagem
    if(!text && !selectedFile) return;

    // Feedback visual de carregando
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Salvando... ⏳';
    
    let publicImageUrl = null;

    try {
        // 1. Upload da imagem (se houver)
        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await _supabase.storage
                .from('notes-images')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // Pegar URL pública
            const { data } = _supabase.storage
                .from('notes-images')
                .getPublicUrl(filePath);
                
            publicImageUrl = data.publicUrl;
        }

        // 2. Salvar no Banco
        const { error } = await _supabase.from('little-notes').insert([{
            text: text,
            color: selectedColor,
            sender: sender,
            image_url: publicImageUrl, // Nova coluna
            rotation: Math.random() * 6 - 3, // Rotação suave
            date: new Date().toLocaleDateString('pt-BR')
        }]);

        if(error) throw error;

        // Limpar tudo
        input.value = '';
        clearImage();
        fetchNotes();

    } catch (error) {
        console.error(error);
        alert("Erro ao salvar! Verifique se criou o Bucket 'notes-images' no Supabase.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
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
        const noteDiv = document.createElement('div');
        
        noteDiv.style.setProperty('--rotation', `${note.rotation}deg`);
        noteDiv.style.transform = `rotate(${note.rotation}deg)`;
        noteDiv.className = `note-card p-6 relative group bg-note-${note.color} rounded-sm shadow-lg flex flex-col justify-between`;
        
        // HTML da Nota com verificação de Imagem
        const imageHtml = note.image_url 
            ? `<div class="mb-3 -mx-2"><img src="${note.image_url}" class="w-full h-40 object-cover rounded-md border-4 border-white shadow-sm transform rotate-1"></div>` 
            : '';

        noteDiv.innerHTML = `
            <div class="h-full flex flex-col">
                ${imageHtml}
                <div class="font-hand text-3xl overflow-y-auto custom-scroll pr-1 flex-grow break-words leading-tight text-slate-800">
                    ${note.text}
                </div>
            </div>
            
            <div class="flex justify-between items-end mt-3 pt-2 border-t border-black/5">
                <span class="text-[11px] uppercase opacity-40 font-bold tracking-widest">${note.date}</span>
                <div class="flex flex-col items-end">
                    <span class="font-hand text-2xl text-rose-600/80">De: ${note.sender || 'Amor'}</span>
                    <button onclick="deleteNote(${note.id})" class="text-rose-400 hover:text-rose-600 hover:scale-110 transition-transform mt-1 opacity-0 group-hover:opacity-100 duration-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(noteDiv);
    });
    
    lucide.createIcons();
}

async function deleteNote(id) {
    if(confirm("Deseja apagar esse recadinho? 🥺")) {
        try {
            // 1. Buscar a nota para verificar se ela tem uma imagem
            const { data: note, error: fetchError } = await _supabase
                .from('little-notes')
                .select('image_url')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // 2. Se existir uma imagem, apagar do Storage primeiro
            if (note && note.image_url) {
                // Extrair o nome do arquivo da URL pública
                // A URL costuma ser: .../storage/v1/object/public/notes-images/NOME_DO_ARQUIVO.jpg
                const urlParts = note.image_url.split('/');
                const fileName = urlParts[urlParts.length - 1];

                const { error: storageError } = await _supabase.storage
                    .from('notes-images')
                    .remove([fileName]);

                if (storageError) {
                    console.warn("Aviso: Erro ao apagar imagem do storage, mas prosseguindo com a nota:", storageError);
                }
            }

            // 3. Apagar a nota do banco de dados
            const { error: deleteError } = await _supabase
                .from('little-notes')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // 4. Atualizar a tela
            fetchNotes();

        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("Houve um erro ao tentar apagar o recado.");
        }
    }
}

// Inicialização
fetchNotes();
// Removi o setInterval curto para evitar excesso de requisições, pode usar um maior se quiser
setInterval(fetchNotes, 30000);
