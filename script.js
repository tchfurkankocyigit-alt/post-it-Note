const { jsPDF } = window.jspdf;
let notes = [];
let editingNoteId = null;
let currentImages = [];





function loadNotes() {
  const savedNotes = localStorage.getItem('quickNotes');
  return savedNotes ? JSON.parse(savedNotes) : [];
}

function saveNote(event) {
  event.preventDefault();

  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const color = document.querySelector('input[name="noteColor"]:checked').value;

  if (editingNoteId) {

    const noteIndex = notes.findIndex(note => note.id === editingNoteId);
    const existingImages = notes[noteIndex].images || [];
    const imagesToKeep = currentImages.filter(img => img.startsWith('data:'));
    
    notes[noteIndex] = {
      ...notes[noteIndex],
      title,
      content,
      color,
      images: [...existingImages.filter(img => currentImages.includes(img)), ...imagesToKeep]
    };
  } else {

    notes.unshift({
      id: generateId(),
      title,
      content,
      color,
      images: currentImages.filter(img => img.startsWith('data:'))
    });
  }

  closeNoteDialog();
  saveNotes();
  renderNotes();
  currentImages = [];
}

function generateId() {
  return Date.now().toString();
}

function saveNotes() {
  localStorage.setItem('quickNotes', JSON.stringify(notes));
}

function deleteNote(noteId) {
  const noteElement = document.getElementById(`note-${noteId}`);
  if (noteElement) {
    noteElement.style.animation = 'fadeOutUp 0.3s ease forwards';
    setTimeout(() => {
      notes = notes.filter(note => note.id !== noteId);
      saveNotes();
      renderNotes();
    }, 300);
  }
}

function deleteImageFromNote(noteId, imageUrl) {
  const noteIndex = notes.findIndex(note => note.id === noteId);
  if (noteIndex !== -1) {
    notes[noteIndex].images = notes[noteIndex].images.filter(img => img !== imageUrl);
    saveNotes();
    renderNotes();
  }
}

function deleteImageFromPreview(index) {
  currentImages.splice(index, 1);
  renderImagePreviews();
}

function renderImagePreviews() {
  const previewContainer = document.getElementById('imagePreviewContainer');
  previewContainer.innerHTML = '';

  currentImages.forEach((imageUrl, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.innerHTML = `
      <img src="${imageUrl}" alt="Preview">
      <button class="delete-image-btn" onclick="deleteImageFromPreview(${index})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    previewContainer.appendChild(previewItem);
  });
}

function renderNotes() {
  const notesContainer = document.getElementById('notesContainer');

  notesContainer.innerHTML = notes.map(note => `
    <div class="note-card ${note.color}" id="note-${note.id}">
      <h3 class="note-title">${note.title}</h3>
      <p class="note-content">${note.content}</p>
      
      ${note.images && note.images.length > 0 ? `
        <div class="note-images-grid">
          ${note.images.map((imageUrl, idx) => `
            <div class="note-image-container">
              <img src="${imageUrl}" alt="Note image ${idx + 1}" class="note-image">
              <button class="delete-image-btn" onclick="deleteImageFromNote('${note.id}', '${imageUrl}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="note-actions">
        <button class="edit-btn" onclick="openNoteDialog('${note.id}')" title="Edit Note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="delete-btn" onclick="deleteNote('${note.id}')" title="Delete Note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
          </svg>
        </button>
        <button class="download-btn" onclick="downloadNoteAsPdf('${note.id}')" title="Download as PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function openNoteDialog(noteId = null) {
  const dialog = document.getElementById('noteDialog');
  const titleInput = document.getElementById('noteTitle');
  const contentInput = document.getElementById('noteContent');
  const imagesInput = document.getElementById('noteImages');
  const colorInput = document.getElementById(`color-default`);


  dialog.classList.remove('dialog-animate-out');
  dialog.classList.add('dialog-animate-in');

  imagesInput.value = '';
  currentImages = [];
  renderImagePreviews();

  if (noteId) {

    const noteToEdit = notes.find(note => note.id === noteId);
    editingNoteId = noteId;
    document.getElementById('dialogTitle').textContent = 'Edit Note';
    titleInput.value = noteToEdit.title;
    contentInput.value = noteToEdit.content;
    

    document.getElementById(`color-${noteToEdit.color}`).checked = true;
    

    if (noteToEdit.images && noteToEdit.images.length > 0) {
      currentImages = [...noteToEdit.images];
      renderImagePreviews();
    }
  } else {

    editingNoteId = null;
    document.getElementById('dialogTitle').textContent = 'Add New Note';
    titleInput.value = '';
    contentInput.value = '';
    colorInput.checked = true;
    currentImages = [];
  }

  imagesInput.onchange = function(e) {
    const files = Array.from(e.target.files).slice(0, 5 - currentImages.length);
    
    if (files.length === 0) return;
    
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        currentImages.push(event.target.result);
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  };

  dialog.showModal();
  titleInput.focus();
}

function closeNoteDialog() {
  const dialog = document.getElementById('noteDialog');
  dialog.classList.remove('dialog-animate-in');
  dialog.classList.add('dialog-animate-out');
  
  setTimeout(() => {
    dialog.close();
    dialog.classList.remove('dialog-animate-out');
  }, 300);
}

function downloadNoteAsPdf(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(note.title, 10, 20);
  
  doc.setFontSize(12);
  const splitContent = doc.splitTextToSize(note.content, 180);
  doc.text(splitContent, 10, 40);

  if (note.images && note.images.length > 0) {
    let yPosition = 60;
    
    note.images.forEach((imageUrl, index) => {
      if (index < 3) { 
        const img = new Image();
        img.src = imageUrl;
        
        img.onload = function() {
          const ratio = img.width / img.height;
          const width = 180;
          const height = width / ratio;
          
          doc.addImage(imageUrl, 'JPEG', 10, yPosition, width, height);
          yPosition += height + 10;
          
          if (index === note.images.length - 1 || index === 2) {
            doc.save(`${note.title}.pdf`);
          }
        };
        
        img.onerror = function() {
          if (index === note.images.length - 1) {
            doc.save(`${note.title}.pdf`);
          }
        };
      }
    });
    
    if (note.images.length === 0) {
      doc.save(`${note.title}.pdf`);
    }
  } else {
    doc.save(`${note.title}.pdf`);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  document.getElementById('themeToggleBtn').innerHTML = isDark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';

  document.body.style.animation = 'none';
  setTimeout(() => {
    document.body.style.animation = 'fadeIn 0.5s ease';
  }, 10);
}

function applyStoredTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggleBtn').innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  applyStoredTheme();
  notes = loadNotes();
  renderNotes();

  document.getElementById('noteForm').addEventListener('submit', saveNote);
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

  document.getElementById('noteDialog').addEventListener('click', function(event) {
    if (event.target === this) {
      closeNoteDialog();
    }
  });

  
  const noteCards = document.querySelectorAll('.note-card');
  noteCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});

