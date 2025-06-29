// ===================
// CONFIGURATION
// ===================
const ADMIN_BASE_URL = "http://localhost:3000"; // ← Placeholder URL for deployment on Render.com

document.getElementById('addEventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        body: formData
            // DO NOT set headers here!
    });

    const result = await response.json();
    if (response.ok) {
        alert('Event added!');
        this.reset();
    } else {
        alert(result.message || 'Failed to add event.');
    }
});

// ===================
// STORIES MANAGEMENT
// ===================
async function loadStories() {
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/stories`);
        const data = await res.json();
        const tbody = document.querySelector('#adminStoriesTable tbody');
        tbody.innerHTML = '';
        data.forEach(story => {
                    tbody.innerHTML += `
                <tr>
                    <td>${story.name || 'Anonymous'}</td>
                    <td>${story.role || ''}</td>
                    <td>${story.institution || ''}</td>
                    <td>${story.story || ''}</td>
                    <td>${story.photo ? `<img src="${story.photo}" alt="photo">` : ''}</td>
                    <td>${story.voiceNote ? `<audio controls src="${story.voiceNote}"></audio>` : ''}</td>
                    <td><span class="${story.status.toLowerCase()}">${story.status}</span></td>
                    <td>
                        <button class="approve" onclick="updateStoryStatus('${story._id}', 'Approved')">Approve</button>
                        <button class="reject" onclick="updateStoryStatus('${story._id}', 'Rejected')">Reject</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

async function updateStoryStatus(id, status) {
    try {
        await fetch(`${ADMIN_BASE_URL}/api/admin/stories/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadStories();
    } catch (error) {
        console.error('Error updating story status:', error);
    }
}

// ===================
// CHAPTERS MANAGEMENT
// ===================
async function loadChapters() {
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/chapters/pending`);
        const chapters = await res.json();
        const tbody = document.getElementById('chapter-list');
        tbody.innerHTML = '';

        chapters.forEach(chap => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${chap.university}</td>
                <td>${chap.location}</td>
                <td>${chap.establishedYear}</td>
                <td>${chap.members}</td>
                <td>${chap.description}</td>
                <td>
                    <button onclick="updateChapterStatus('${chap._id}', 'approved')">Approve</button>
                    <button onclick="updateChapterStatus('${chap._id}', 'rejected')">Reject</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading chapters:", error);
    }
}

async function updateChapterStatus(id, status) {
    try {
        await fetch(`${ADMIN_BASE_URL}/api/chapters/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        alert(`${status.charAt(0).toUpperCase() + status.slice(1)}!`);
        loadChapters();
    } catch (error) {
        console.error('Error updating chapter status:', error);
    }
}

// ===================
// PROGRAMS MANAGEMENT
// ===================
const PROGRAMS_API = `${ADMIN_BASE_URL}/api/programs`;

document.getElementById('program-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('program-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${PROGRAMS_API}/${id}` : PROGRAMS_API;

    const programData = {
        name: document.getElementById('program-name').value,
        category: document.getElementById('program-category').value,
        description: document.getElementById('program-description').value,
        status: document.getElementById('program-status').value
    };

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programData)
    });

    fetchPrograms();
});

async function fetchPrograms() {
    try {
        const res = await fetch(PROGRAMS_API);
        const programs = await res.json();
        const tbody = document.getElementById('programs-table-body');
        tbody.innerHTML = '';

        programs.forEach((program, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${program.name}</td>
                <td>${program.category}</td>
                <td>${program.status}</td>
                <td>${new Date(program.updatedAt || program.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editProgram('${program._id}', '${program.name}', '${program.category}', \`${program.description}\`, '${program.status}')">✏️</button>
                        <button class="action-btn delete" onclick="deleteProgram('${program._id}')">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching programs:', error);
    }
}

function editProgram(id, name, category, description, status) {
    document.getElementById('program-id').value = id;
    document.getElementById('program-name').value = name;
    document.getElementById('program-category').value = category;
    document.getElementById('program-description').value = description;
    document.getElementById('program-status').value = status;
    document.getElementById('modal-title').textContent = 'Edit Program';
    document.getElementById('program-modal').style.display = 'block';
}

async function deleteProgram(id) {
    if (!confirm("Are you sure you want to delete this program?")) return;
    await fetch(`${PROGRAMS_API}/${id}`, { method: 'DELETE' });
    fetchPrograms();
}

// ===================
// ARTICLES MANAGEMENT
// ===================
document.getElementById('articleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    try {
        const response = await fetch(`${ADMIN_BASE_URL}/api/submit-article`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (response.ok) {
            alert('Article submitted successfully!');
            this.reset();
            if (typeof fetchArticles === 'function') fetchArticles();
            document.getElementById('articles-modal').style.display = 'none';
        } else {
            alert(result.error || 'Failed to submit article.');
        }
    } catch (error) {
        console.error('Error submitting article:', error);
        alert('An error occurred. Please try again.');
    }
});

async function fetchArticles() {
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/dashboard/articles`);
        const articles = await res.json();
        const tableBody = document.getElementById('articles-table-body');
        tableBody.innerHTML = '';
        articles.forEach(article => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${article.title}</td>
                <td>${article.authorName}</td>
                <td>${article.email || ''}</td>
                <td>
                    ${article.image ? `<img src="${article.image}" alt="Article Image" width="60"/>` : ''}
                </td>
                <td>
                    <span style="color:${article.status === 'Approved' ? 'green' : article.status === 'Rejected' ? 'red' : 'orange'};">
                        ${article.status}
                    </span>
                </td>
                <td>
                    ${article.status === 'Pending' ? `
                        <button onclick="approveArticle('${article._id}')">Approve</button>
                        <button onclick="rejectArticle('${article._id}')">Reject</button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
    }
}

async function approveArticle(id) {
    if (!confirm('Approve this article?')) return;
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/articles/${id}/approve`, { method: 'PATCH' });
        if (res.ok) {
            fetchArticles();
        } else {
            alert('Failed to approve article');
        }
    } catch (err) {
        alert('Error approving article');
    }
}

async function rejectArticle(id) {
    if (!confirm('Reject this article?')) return;
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/articles/${id}/reject`, { method: 'PATCH' });
        if (res.ok) {
            fetchArticles();
        } else {
            alert('Failed to reject article');
        }
    } catch (err) {
        alert('Error rejecting article');
    }
}

async function deleteArticle(id) {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/articles/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Article deleted');
            fetchArticles();
        } else {
            alert('Failed to delete');
        }
    } catch (error) {
        console.error('Error deleting article:', error);
    }
}

function editArticle(id) {
    window.location.href = `/admin/edit-article.html?id=${id}`;
}

// ===================
// BLOGS / STORIES (Dashboard)
// ===================
async function fetchBlogs() {
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/api/dashboard/stories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blogs = await response.json();
        const tableBody = document.getElementById('blogs-table-body');
        tableBody.innerHTML = '';
        blogs.forEach(blog => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${blog.title}</td>
                <td>${blog.authorName || ''}</td>
                <td>${blog.email || ''}</td>
                <td>
                    <span style="color:${blog.status === 'Approved' ? 'green' : blog.status === 'Rejected' ? 'red' : 'orange'};">
                        ${blog.status}
                    </span>
                </td>
                <td>
                    ${blog.status === 'Pending' ? `
                        <button onclick="approveBlog('${blog._id}')">Approve</button>
                        <button onclick="rejectBlog('${blog._id}')">Reject</button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        alert('Error fetching blogs');
        console.error(error);
    }
}

async function approveBlog(id) {
    if (!confirm('Approve this blog?')) return;
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/stories/${id}/approve`, { method: 'PATCH' });
        if (res.ok) {
            fetchBlogs();
        } else {
            alert('Failed to approve blog');
        }
    } catch (err) {
        alert('Error approving blog');
    }
}

async function rejectBlog(id) {
    if (!confirm('Reject this blog?')) return;
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/stories/${id}/reject`, { method: 'PATCH' });
        if (res.ok) {
            fetchBlogs();
        } else {
            alert('Failed to reject blog');
        }
    } catch (err) {
        alert('Error rejecting blog');
    }
}

// ===================
// TESTIMONIALS MANAGEMENT
// ===================
async function loadTestimonials() {
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/admin/testimonials`);
        const data = await res.json();
        const tbody = document.querySelector('#adminTable tbody');
        tbody.innerHTML = '';
        data.forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td>${t.name || 'Anonymous'}</td>
                    <td>${t.role}</td>
                    <td>${t.institution}</td>
                    <td>${t.story}</td>
                    <td>${t.photo ? `<img src="${t.photo}" width="60">` : ''}</td>
                    <td>${t.voiceNote ? `<audio controls src="${t.voiceNote}"></audio>` : ''}</td>
                    <td>${t.status}</td>
                    <td>
                        <button onclick="updateTestimonialStatus('${t._id}', 'Approved')">Approve</button>
                        <button onclick="updateTestimonialStatus('${t._id}', 'Rejected')">Reject</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

async function updateTestimonialStatus(id, status) {
    try {
        await fetch(`${ADMIN_BASE_URL}/api/admin/testimonials/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadTestimonials();
    } catch (error) {
        console.error('Error updating testimonial status:', error);
    }
}

// ===================
// SUBSCRIBERS MANAGEMENT
// ===================
async function fetchSubscribers() {
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/api/dashboard/subscribers`);
        const subscribers = await response.json();
        const tableBody = document.getElementById('subscribers-table-body');
        tableBody.innerHTML = '';
        subscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subscriber.email}</td>
                <td>${new Date(subscriber.subscribedAt).toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
    }
}

// ===================
// FILE UPLOADS & RESOURCES
// ===================
async function loadFiles(filter = '') {
    try {
        let url = `${ADMIN_BASE_URL}/api/pdfs`;
        if (filter) url += `?q=${encodeURIComponent(filter)}`;
        const res = await fetch(url);
        const pdfs = await res.json();
        const container = document.getElementById('pdfList');
        container.innerHTML = '';
        pdfs.forEach(pdf => {
            const div = document.createElement('div');
            div.innerHTML = `
                <strong>${pdf.title}</strong> (${pdf.category} - ${pdf.fileType})
                <button onclick="deleteFile('${pdf._id}')">Delete</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

document.getElementById('uploadblogs').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        document.getElementById('status').textContent = data.message || data.error;
        loadFiles();
    } catch (error) {
        console.error('Error uploading file:', error);
    }
});

async function deleteFile(id) {
    try {
        const res = await fetch(`${ADMIN_BASE_URL}/api/pdfs/${id}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

document.getElementById('filterInput')?.addEventListener('input', function() {
    loadFiles(this.value);
});

// ===================
// SUMMITS MANAGEMENT
// ===================
document.getElementById('save-summit').addEventListener('click', () => {
    const formData = {
        title: document.getElementById('summit-title').value.trim(),
        year: parseInt(document.getElementById('summit-year').value),
        date: document.getElementById('summit-date').value.trim(),
        location: document.getElementById('summit-location').value.trim(),
        description: document.getElementById('summit-description').value.trim(),
        imageUrl: document.getElementById('summit-image').value.trim()
    };

    if (!formData.title || !formData.year || !formData.date || !formData.location || !formData.description || !formData.imageUrl) {
        alert("Please fill out all fields.");
        return;
    }
    console.log("Saving summit:", formData);
    alert("Summit saved successfully!");
    closeModals();
    clearSummitForm();
    loadSummits();
});

function clearSummitForm() {
    document.getElementById('summit-title').value = "";
    document.getElementById('summit-year').value = "";
    document.getElementById('summit-date').value = "";
    document.getElementById('summit-location').value = "";
    document.getElementById('summit-description').value = "";
    document.getElementById('summit-image').value = "";
}

async function loadSummits() {
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/api/summits`);
        const summits = await response.json();
        const tableBody = document.querySelector("#summits-tab #summit-table-body");
        tableBody.innerHTML = "";

        if (!summits.length) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center'>No summits found.</td></tr>";
            return;
        }

        summits.forEach(summit => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${summit._id}</td>
                <td>${summit.title}</td>
                <td>${summit.year}</td>
                <td>${summit.date}</td>
                <td>${summit.location}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editSummit('${summit._id}')">✏️</button>
                        <button class="action-btn delete" onclick="deleteSummit('${summit._id}')">🗑️</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load summits:", err);
    }
}

function editSummit(id) {
    alert("Edit functionality coming soon for summit ID: " + id);
}

function deleteSummit(id) {
    if (confirm("Are you sure you want to delete this summit?")) {
        alert("Delete functionality coming soon for summit ID: " + id);
    }
}

// ===================
// MESSAGING & CHAT
// ===================
const socket = io(); // Connect to backend
let currentEmail = "";

window.openChat = function(email) {
    const replyToField = document.getElementById("reply-to");
    if (replyToField) {
        replyToField.value = email;
        openModal("reply-modal");
        currentEmail = email;
    }
};

async function loadMessages() {
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/api/messages`);
        const messages = await response.json();
        const list = document.getElementById("admin-message-list");
        if (!list) return;
        list.innerHTML = "";
        if (!messages.length) {
            list.innerHTML = "<li>No messages yet.</li>";
            return;
        }
        messages.forEach(msg => {
            const item = document.createElement("li");
            item.style.marginBottom = "1rem";
            item.innerHTML = `
                <strong>${msg.name}</strong> (${msg.email})<br>
                <em>"${msg.text}"</em><br>
                <small>${new Date(msg.timestamp).toLocaleString()}</small><br>
                <button class="btn btn-primary start-chat-btn" onclick="openChat('${msg.email}')">Start Chat</button>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error("Failed to load messages:", err);
    }
}

document.getElementById("send-reply-btn")?.addEventListener("click", () => {
    const response = document.getElementById("reply-text").value.trim();
    if (!response || !currentEmail) {
        alert("Please enter a reply and select a user.");
        return;
    }
    socket.emit("coordinator_reply", {
        to: currentEmail,
        text: response
    });
    alert("Reply sent!");
    closeModals();
    document.getElementById("reply-text").value = "";
});

// ===================
// SIDEBAR & NAVIGATION
// ===================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    if (window.innerWidth <= 768 && 
        !sidebar.contains(event.target) && 
        !toggle.contains(event.target) && 
        sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    });
});

// ===================
// INITIALIZATION ON DOM LOAD
// ===================
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadStories();
    loadChapters();
    fetchPrograms();
    fetchArticles();
    fetchBlogs();
    loadTestimonials();
    fetchSubscribers();
    loadFiles();
    loadSummits();
    loadMessages();

    // File upload preview handler
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const fileUpload = this.parentElement;
                let preview = fileUpload.querySelector('.file-preview');
                if (!preview) {
                    preview = document.createElement('img');
                    preview.className = 'file-preview';
                    fileUpload.appendChild(preview);
                }
                const reader = new FileReader();
                reader.onload = e => preview.src = e.target.result;
                reader.readAsDataURL(this.files[0]);
            }
        });
    });

    // Tab Navigation for messages (if applicable)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            if (tabId === 'chapters') {
                loadMessages();
            }
        });
    });
});         }
        });
    });
});