import { Router } from 'itty-router';

// Embedded static assets
const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WallPoll - 壁纸投票画廊</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>WallPoll</h1>
            <div id="user-info">
                <input type="number" id="user-id" min="1" max="59" placeholder="输入用户ID (1-59)">
                <button id="login">登录</button>
            </div>
        </header>
        <main>
            <div id="upload-section" style="display: none;">
                <h2>上传壁纸</h2>
                <input type="file" id="upload-file" accept="image/*">
                <button id="upload-button">上传</button>
            </div>
            <div id="gallery">
                <h2>壁纸画廊</h2>
                <div id="image-grid"></div>
            </div>
            <div id="vote-section" style="display: none;">
                <h2>投票</h2>
                <p>您可以投出最多2票，不能投给自己上传的作品。</p>
                <button id="vote-button">投票</button>
            </div>
        </main>
    </div>
    <script type="module" src="/ts/frontend.ts"></script>
</body>
</html>
`;

const styleCSS = `/* 全局样式 */
body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #f5f5f5; /* 浅灰色背景 */
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

#app {
    width: 100%;
    max-width: 1200px;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
}

/* 头部样式 */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;
}

h1 {
    color: #6c829e; /* 浅蓝色标题 */
    margin: 0;
    font-size: 2em;
}

#user-info {
    display: flex;
    gap: 10px;
}

#user-id {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 150px;
}

button {
    padding: 8px 16px;
    background-color: #6c829e; /* 浅蓝色按钮 */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #5a6f8c;
}

/* 主要内容样式 */
main {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

h2 {
    color: #6c829e; /* 浅蓝色标题 */
    margin-bottom: 10px;
}

/* 上传区域 */
#upload-section {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
    border-radius: 8px;
}

#upload-file {
    margin-bottom: 10px;
}

/* 画廊样式 */
#gallery {
    width: 100%;
}

#image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.image-item {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-item:hover {
    transform: scale(1.05);
}

.image-item .vote-count {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 5px 10px;
    border-radius: 4px 0 0 0;
    font-size: 0.9em;
}

/* 投票区域 */
#vote-section {
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    #app {
        padding: 10px;
    }

    header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    #image-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }
}
`;

const frontendTS = `document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('user-id') as HTMLInputElement;
    const loginButton = document.getElementById('login') as HTMLButtonElement;
    const uploadSection = document.getElementById('upload-section') as HTMLElement;
    const uploadFile = document.getElementById('upload-file') as HTMLInputElement;
    const uploadButton = document.getElementById('upload-button') as HTMLButtonElement;
    const voteSection = document.getElementById('vote-section') as HTMLElement;
    const voteButton = document.getElementById('vote-button') as HTMLButtonElement;
    const imageGrid = document.getElementById('image-grid') as HTMLElement;

    let currentUserId: number | null = null;
    let selectedImages: Set<number> = new Set();

    loginButton.addEventListener('click', async () => {
        const userId = parseInt(userIdInput.value);
        if (userId >= 1 && userId <= 59) {
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId })
                });
                if (response.ok) {
                    currentUserId = userId;
                    userIdInput.disabled = true;
                    loginButton.textContent = '已登录';
                    loginButton.disabled = true;
                    uploadSection.style.display = 'block';
                    voteSection.style.display = 'block';
                    loadGallery();
                } else {
                    alert('登录失败');
                }
            } catch (error) {
                alert('登录时出错');
            }
        } else {
            alert('请输入有效的用户ID（1-59）');
        }
    });

    uploadButton.addEventListener('click', async () => {
        if (!uploadFile.files || uploadFile.files.length === 0) {
            alert('请选择一个文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile.files[0]);
        formData.append('userId', currentUserId!.toString());

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData as BodyInit
            });
            if (response.ok) {
                alert('上传成功');
                uploadFile.value = '';
                loadGallery();
            } else {
                alert('上传失败');
            }
        } catch (error) {
            alert('上传时出错');
        }
    });

    voteButton.addEventListener('click', async () => {
        if (selectedImages.size === 0) {
            alert('请选择至少一张图片进行投票');
            return;
        }

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUserId,
                    imageIds: Array.from(selectedImages)
                })
            });
            if (response.ok) {
                alert('投票成功');
                selectedImages.clear();
                updateImageGrid();
            } else {
                alert('投票失败');
            }
        } catch (error) {
            alert('投票时出错');
        }
    });

    async function loadGallery() {
        try {
            const response = await fetch('/api/gallery');
            if (response.ok) {
                const images = await response.json();
                imageGrid.innerHTML = '';
                images.forEach((image: any) => {
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    imageItem.dataset.id = image.id;
                    if (image.userId === currentUserId) {
                        imageItem.style.pointerEvents = 'none';
                    } else {
                        imageItem.addEventListener('click', () => toggleImageSelection(image.id));
                    }
                    imageItem.innerHTML = \`
                        <img src="\${image.url}" alt="壁纸">
                        <div class="vote-count">票数: \${image.votes}</div>
                    \`;
                    imageGrid.appendChild(imageItem);
                });
            }
        } catch (error) {
            console.error('加载画廊时出错', error);
        }
    }

    function toggleImageSelection(id: number) {
        if (selectedImages.has(id)) {
            selectedImages.delete(id);
        } else if (selectedImages.size < 2) {
            selectedImages.add(id);
        } else {
            alert('您最多可以投2票');
            return;
        }
        updateImageGrid();
    }

    function updateImageGrid() {
        const imageItems = document.querySelectorAll('.image-item');
        imageItems.forEach(item => {
            if (selectedImages.has(parseInt(item.dataset.id!))) {
                item.style.border = '3px solid #6c829e';
            } else {
                item.style.border = 'none';
            }
        });
    }
});
`;


// Handler functions
async function handleAuth(request: Request, env: any): Promise<Response> {
  const body = await request.json();
  const userId = body.userId;

  if (!userId || userId < 1 || userId > 59) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 这里可以添加更多的认证逻辑，如果需要的话
  return new Response(JSON.stringify({ userId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleUpload(request: Request, env: any): Promise<Response> {
  // 这里实现上传逻辑
  // 包括图片裁切为16:9比例
  return new Response(JSON.stringify({ message: 'Upload functionality not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleVote(request: Request, env: any): Promise<Response> {
  // 这里实现投票逻辑
  // 用户最多投两票，不能投给自己
  return new Response(JSON.stringify({ message: 'Vote functionality not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGallery(request: Request, env: any): Promise<Response> {
  // 这里实现画廊展示逻辑
  return new Response(JSON.stringify({ message: 'Gallery functionality not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDownload(request: Request, env: any): Promise<Response> {
  // 这里实现图片下载逻辑
  return new Response(JSON.stringify({ message: 'Download functionality not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}


const router = Router();

router.post('/api/auth', handleAuth);
router.post('/api/upload', handleUpload);
router.post('/api/vote', handleVote);
router.get('/api/gallery', handleGallery);
router.get('/api/download/:id', handleDownload);

// 静态文件服务
router.get('/', (request: Request) => {
    return new Response(indexHTML, {
        headers: { 'Content-Type': 'text/html' },
    });
});

router.get('/index.html', (request: Request) => {
    return new Response(indexHTML, {
        headers: { 'Content-Type': 'text/html' },
    });
});

router.get('/css/style.css', (request: Request) => {
    return new Response(styleCSS, {
        headers: { 'Content-Type': 'text/css' },
    });
});

router.get('/ts/frontend.ts', (request: Request) => {
    return new Response(frontendTS, {
        headers: { 'Content-Type': 'application/javascript' }, // Workers will compile TS to JS
    });
});

// Fallback for other static assets (will return 404)
router.get('*', () => new Response('Not Found', { status: 404 }));


export default {
  fetch: router.handle as unknown as (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>
};
