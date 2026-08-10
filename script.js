// ===== DATA =====
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
tasks = tasks.map((t) => (t.id ? t : { ...t, id: Date.now() + Math.random() }));

let filter = 'all';

// Menyimpan daftar ID task yang notifikasinya sudah pernah dikirim agar tidak berulang-ulang muncul setiap menit
let notifiedTasks = {};

// ===== SIMPAN DATA =====
function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== TAMBAH TASK =====
function addTask() {
  const text = document.getElementById('taskInput').value;
  const date = document.getElementById('dateInput').value;

  // validasi
  if (!text.trim()) {
    alert('Tugas tidak boleh kosong!');
    return;
  }

  if (!date) {
    alert('Tanggal dan jam harus diisi!');
    return;
  }

  tasks.push({ id: Date.now(), text, date, done: false });

  document.getElementById('taskInput').value = '';
  document.getElementById('dateInput').value = '';

  save();
  render();
  checkDeadlines();
}

// ===== TOGGLE DONE =====
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    save();
    render();
  }
}

// ===== HAPUS TASK =====
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

// ===== FILTER =====
function setFilter(f) {
  filter = f;
  render();
}

// ===== DARK MODE =====
function toggleDark() {
  document.body.classList.toggle('dark');
}

// ===== PROGRESS BAR =====
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  const percent = total === 0 ? 0 : (done / total) * 100;

  document.getElementById('progressBar').style.width = percent + '%';
  document.getElementById('progressText').innerText = `${Math.round(percent)}% selesai`;
}

// ===== NOTIFIKASI DEADLINE DENGAN TINGKAT URGENSI =====
function checkDeadlines() {
  const now = new Date();

  tasks.forEach((task) => {
    if (task.done || !task.date) return;

    const taskDate = new Date(task.date);
    const timeDiff = taskDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    let message = '';
    let statusKey = '';

    // 1. SISA 7 HARI (Berada di rentang h-6 sampai h-7)
    if (daysDiff > 6 && daysDiff <= 7) {
      message = `🔔 Pengingat: Tugas "${task.text}" sisa 7 hari lagi. Masih ada waktu santai!`;
      statusKey = '7hari';
    }
    // 2. BESOK / SISA 1 HARI (Berada di rentang h-1 sampai h-2)
    else if (daysDiff > 1 && daysDiff <= 2) {
      message = `⚠️ Penting: Tugas "${task.text}" harus dikerjakan, besok sudah deadline!`;
      statusKey = 'besok';
    }
    // 3. HARI INI (Kurang dari 24 jam menuju jam pelaksanaan deadline)
    else if (daysDiff > 0 && daysDiff <= 1) {
      message = `🚨 GAWAT: Tugas "${task.text}" deadline HARI INI! Segera selesaikan sebelum terlambat!`;
      statusKey = 'hariini';
    }
    // 4. LEWAT DEADLINE (Waktu target sudah berada di masa lampau)
    else if (daysDiff <= 0) {
      message = `❌ Terlewat: Tugas "${task.text}" sudah melewati batas waktu deadline!`;
      statusKey = 'lewat';
    }

    // Mengirim notifikasi hanya jika pesan tersebut belum pernah dikirim sebelumnya untuk ID task ini
    if (message && notifiedTasks[`${task.id}-${statusKey}`] !== true) {
      triggerNotification(message);
      notifiedTasks[`${task.id}-${statusKey}`] = true;
    }
  });
}

// ===== TRIGGER TOAST =====
function triggerNotification(message) {
  console.log(message);
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;

  container.appendChild(toast);

  // Animasi keluar setelah 5 detik
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

// ===== FORMAT DISPLAY TANGGAL & JAM =====
function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);

  const tgl = String(d.getDate()).padStart(2, '0');
  const bln = String(d.getMonth() + 1).padStart(2, '0');
  const thn = d.getFullYear();
  const jam = String(d.getHours()).padStart(2, '0');
  const mnt = String(d.getMinutes()).padStart(2, '0');

  return `${tgl}/${bln}/${thn} pukul ${jam}:${mnt}`;
}

// ===== RENDER =====
function render() {
  const list = document.getElementById('taskList');

  // animasi keluar
  const oldTasks = document.querySelectorAll('.task');
  oldTasks.forEach((el) => el.classList.add('removing'));

  setTimeout(() => {
    list.innerHTML = '';
    const now = new Date();

    tasks
      .filter((t) => {
        if (filter === 'active') return !t.done;
        if (filter === 'done') return t.done;
        return true;
      })
      // Menyortir tugas berdasarkan deadline terdekat
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      })
      .forEach((task) => {
        const div = document.createElement('div');

        const taskDate = new Date(task.date);
        const isOverdue = task.date && taskDate < now && !task.done;

        div.className = 'task' + (task.done ? ' done' : '') + (isOverdue ? ' overdue' : '');

        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            
            <input type="checkbox" 
              ${task.done ? 'checked' : ''} 
              onchange="toggleTask(${task.id})">

            <div>
              ${task.text}
              <small>Deadline: ${formatDisplayDate(task.date)}</small>
            </div>

          </div>

          <button onclick="deleteTask(${task.id})">❌</button>
        `;

        list.appendChild(div);
      });

    updateProgress();
  }, 200);
}

// ===== PERUBAHAN UTAMA: BACKGROUND ENGINE REAL-TIME =====
function runRealTimeUpdate() {
  const now = new Date();

  // 1. Periksa semua card yang tampil di layar
  const taskElements = document.querySelectorAll('.task');

  tasks
    .filter((t) => {
      if (filter === 'active') return !t.done;
      if (filter === 'done') return t.done;
      return true;
    })
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    })
    .forEach((task, index) => {
      const el = taskElements[index];
      if (!el) return;

      const taskDate = new Date(task.date);
      const isOverdue = task.date && taskDate < now && !task.done;

      // Jika waktu terlewati, langsung tambahkan class 'overdue' (merah) ke DOM tanpa merusak posisi/animasi
      if (isOverdue && !el.classList.contains('overdue')) {
        el.classList.add('overdue');
      } else if (!isOverdue && el.classList.contains('overdue')) {
        el.classList.remove('overdue');
      }
    });

  // 2. Jalankan juga pengecekan alarm notifikasi berseri
  checkDeadlines();
}

// ===== JALANKAN AWAL =====
render();
checkDeadlines();

// Interval berjalan setiap 30 detik untuk memastikan perubahan warna merah tepat waktu (tanpa refresh!)
setInterval(runRealTimeUpdate, 30000);
s;
