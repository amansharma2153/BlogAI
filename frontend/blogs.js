const blogsContainer = document.getElementById("blogsContainer");

async function loadBlogs() {
  try {
    const res = await fetch("https://blogai-ekes.onrender.com/api/blogs");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const blogs = await res.json();

    blogsContainer.innerHTML = "";

    if (blogs.length === 0) {
      blogsContainer.innerHTML = `<p class="text-gray-500 col-span-3 text-center">No blogs found. Create one on the Home page!</p>`;
      return;
    }

    blogs.forEach(blog => {
      const blogCard = document.createElement("div");
      blogCard.className = "bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition";

      blogCard.innerHTML = `
        ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="w-full h-48 object-cover">` : ''}
        <div class="p-4">
          <h3 class="text-xl font-bold mb-2 line-clamp-2">${blog.title}</h3>
          <p class="text-gray-700 text-sm mb-2 line-clamp-3">${blog.content}</p>
          <p class="text-gray-500 text-xs">— ${blog.author}</p>
          <p class="text-gray-400 text-xs mt-1">${new Date(blog.createdAt).toLocaleString()}</p>
        </div>
      `;
      blogsContainer.appendChild(blogCard);
    });

  } catch (err) {
    console.error("Error loading blogs:", err);
    blogsContainer.innerHTML = `<p class="text-red-500 col-span-3 text-center">Failed to load blogs. Try again later.</p>`;
  }
}


window.addEventListener("DOMContentLoaded", loadBlogs);
