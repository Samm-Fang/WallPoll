interface User {
  id: number;
  uploadedImage?: string;
  votes: string[];
}

interface Image {
  id: string;
  url: string;
  uploaderId: number;
  votes: number;
  uploadDate: string;
}

let currentUser: User | null = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp(): void {
  checkLoginStatus();
  loadGallery();
  setupEventListeners();
}

function checkLoginStatus(): void {
  const userId = localStorage.getItem('userId');
  if (userId) {
    loginUser(parseInt(userId, 10), false);
  }
}

function setupEventListeners(): void {
  document.getElementById('login-btn')?.addEventListener('click', () => {
    const userIdInput = document.getElementById('user-id') as HTMLInputElement;
    const userId = parseInt(userIdInput.value, 10);
    if (!isNaN(userId)) {
      loginUser(userId);
    } else {
      alert('请输入有效的用户ID');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logoutUser();
  });

  document.getElementById('upload-btn')?.addEventListener('click', () => {
    uploadImage();
  });
}

async function loginUser(userId: number, saveToStorage: boolean = true): Promise<void> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (data.success) {
      currentUser = data.user;
      if (saveToStorage) {
        localStorage.setItem('userId', userId.toString());
      }
      updateUIAfterLogin();
    } else {
      alert(data.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('登录时发生错误');
  }
}

function logoutUser(): void {
  currentUser = null;
  localStorage.removeItem('userId');
  updateUIAfterLogout();
}

function updateUIAfterLogin(): void {
  document.getElementById('login-section')?.classList.add('hidden');
  document.getElementById('user-section')?.classList.remove('hidden');
  document.getElementById('upload-section')?.classList.remove('hidden');
  document.getElementById('current-user-id')!.textContent = currentUser!.id.toString();
  
  if (currentUser!.uploadedImage) {
    (document.getElementById('upload-file') as HTMLInputElement).disabled = true;
    (document.getElementById('upload-btn') as HTMLButtonElement).disabled = true;
  }
}

function updateUIAfterLogout(): void {
  document.getElementById('login-section')?.classList.remove('hidden');
  document.getElementById('user-section')?.classList.add('hidden');
  document.getElementById('upload-section')?.classList.add('hidden');
  (document.getElementById('user-id') as HTMLInputElement).value = '';
  (document.getElementById('upload-file') as HTMLInputElement).value = '';
  (document.getElementById('upload-file') as HTMLInputElement).disabled = false;
  (document.getElementById('upload-btn') as HTMLButtonElement).disabled = false;
}

async function uploadImage(): Promise<void> {
  if (!currentUser) {
    alert('请先登录');
    return;
  }

  const fileInput = document.getElementById('upload-file') as HTMLInputElement;
  const file = fileInput.files?.[0];

  if (!file) {
    alert('请选择文件');
    return;
  }

  const formData = new FormData();
  formData.append('userId', currentUser.id.toString());
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      alert('上传成功');
      fileInput.value = '';
      fileInput.disabled = true;
      (document.getElementById('upload-btn') as HTMLButtonElement).disabled = true;
      currentUser!.uploadedImage = data.image.id;
      loadGallery();
    } else {
      alert(data.message || '上传失败');
    }
  } catch (error) {
    console.error('上传错误:', error);
    alert('上传时发生错误');
  }
}

async function loadGallery(): Promise<void> {
  try {
    const response = await fetch('/api/gallery');
    const data = await response.json();
    if (data.success) {
      displayGallery(data.images);
    } else {
      alert('加载画廊失败');
    }
  } catch (error) {
    console.error('加载画廊错误:', error);
    alert('加载画廊时发生错误');
  }
}

function displayGallery(images: Image[]): void {
  const gallery = document.getElementById('gallery') as HTMLElement;
  gallery.innerHTML = '';

  images.forEach(image => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${image.url}" alt="壁纸">
      <div class="info">
        <span>票数: ${image.votes}</span>
        <span>上传者: ${image.uploaderId}</span>
        <button onclick="voteForImage('${image.id}')">投票</button>
        <button onclick="downloadImage('${image.id}')">下载</button>
      </div>
    `;
    gallery.appendChild(item);
  });
}

async function voteForImage(imageId: string): Promise<void> {
  if (!currentUser) {
    alert('请先登录');
    return;
  }

  if (currentUser.uploadedImage === imageId) {
    alert('不能给自己上传的图片投票');
    return;
  }

  if (currentUser.votes.length >= 2) {
    alert('您已经投出了最多的票数');
    return;
  }

  if (currentUser.votes.includes(imageId)) {
    alert('您已经投过这张图片了');
    return;
  }

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: currentUser.id, imageId }),
    });

    const data = await response.json();
    if (data.success) {
      alert('投票成功');
      currentUser.votes.push(imageId);
      loadGallery();
    } else {
      alert(data.message || '投票失败');
    }
  } catch (error) {
    console.error('投票错误:', error);
    alert('投票时发生错误');
  }
}

async function downloadImage(imageId: string): Promise<void> {
  try {
    window.location.href = `/api/download?id=${imageId}`;
  } catch (error) {
    console.error('下载错误:', error);
    alert('下载时发生错误');
  }
}

// 将函数添加到全局作用域，以便HTML中的onclick事件可以访问
(window as any).voteForImage = voteForImage;
(window as any).downloadImage = downloadImage;
