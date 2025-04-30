document.addEventListener('DOMContentLoaded', () => {
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
                body: formData
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
                    imageItem.innerHTML = `
                        <img src="${image.url}" alt="壁纸">
                        <div class="vote-count">票数: ${image.votes}</div>
                    `;
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
