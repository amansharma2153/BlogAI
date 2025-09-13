const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const authorInput = document.getElementById('author');
const preview = document.getElementById('preview');
const titleSuggestion = document.getElementById('titleSuggestion');
const imageContainer = document.getElementById('imageSuggestions');
const imageUpload = document.getElementById('imageUpload');
const previewImage = document.getElementById('previewImage');


function updatePreview() {
  preview.querySelector("h3").textContent = titleInput.value || "Your blog title will appear here...";
  preview.querySelector("p.mb-4").textContent = contentInput.value || "Blog content preview...";
  preview.querySelector("p.text-sm").textContent = "— " + (authorInput.value || "Author");
}
titleInput.addEventListener('input', updatePreview);
contentInput.addEventListener('input', updatePreview);
authorInput.addEventListener('input', updatePreview);


imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      previewImage.src = event.target.result;
      previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});


function attachImageClick(img, url) {
  img.addEventListener("click", () => {
    previewImage.src = url;
    previewImage.classList.remove("hidden");
  });
}


async function fetchTitleSuggestion() {
  if (!titleInput.value.trim()) return;
  try {
    const res = await fetch("http://localhost:5000/api/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: titleInput.value })
    });
    const data = await res.json();
    if (data.suggestion) {
      titleSuggestion.textContent = "💡 Suggested: " + data.suggestion;
    } else {
      titleSuggestion.textContent = "⚠️ No suggestion received";
    }
  } catch (err) {
    console.error("Title suggestion error:", err);
    titleSuggestion.textContent = "⚠️ Failed to fetch suggestion";
  }
}


titleSuggestion.addEventListener("click", () => {
  const suggestionText = titleSuggestion.textContent.replace("💡 Suggested: ", "");
  if (suggestionText) {
    titleInput.value = suggestionText;
    updatePreview();
  }
});


async function fetchContentSuggestion() {
  if (!titleInput.value.trim()) return;
  try {
    const res = await fetch("http://localhost:5000/api/suggest-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: titleInput.value })
    });

    const data = await res.json();

    if (data.content) {
      contentInput.value = data.content;
      updatePreview();
    } else {
      console.warn("⚠️ No content received", data);
    }
  } catch (err) {
    console.error("Content suggestion error:", err);
  }
}


async function fetchImageSuggestions() {
  if (!titleInput.value.trim()) return;
  try {
    const res = await fetch(`http://localhost:5000/api/images?query=${encodeURIComponent(titleInput.value)}`);
    const data = await res.json();
    imageContainer.innerHTML = "";
    if (data.length > 0) {
      data.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.className = "rounded-lg shadow cursor-pointer hover:opacity-80";
        attachImageClick(img, url); // 👈 clicking will set preview
        imageContainer.appendChild(img);
      });
    } else {
      imageContainer.innerHTML = "<p class='col-span-3 text-gray-400 text-sm'>No images found.</p>";
    }
  } catch (err) {
    console.error("Image suggestion error:", err);
    imageContainer.innerHTML = "<p class='col-span-3 text-gray-400 text-sm'>Failed to load images.</p>";
  }
}


async function saveBlogAsPDF() {
  const blogData = {
    title: titleInput.value,
    content: contentInput.value,
    author: authorInput.value,
  };

  if (previewImage.src.startsWith("data:")) {
    blogData.imageBase64 = previewImage.src; // uploaded file
  } else if (previewImage.src.startsWith("http")) {
    blogData.imageUrl = previewImage.src; // AI/Unsplash image
  }

  const res = await fetch("http://localhost:5000/api/save-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blogData),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${blogData.title.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


async function saveBlog() {
  const blogData = {
    title: titleInput.value,
    content: contentInput.value,
    author: authorInput.value,
  };

  if (previewImage.src.startsWith("data:")) {
    blogData.imageBase64 = previewImage.src;
  } else if (previewImage.src.startsWith("http")) {
    blogData.imageUrl = previewImage.src;
  }

  try {
    const res = await fetch("http://localhost:5000/api/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blogData),
    });
    const newBlog = await res.json();
    console.log("✅ Blog saved:", newBlog);
    alert("Blog saved successfully!");
  } catch (err) {
    console.error("❌ Error saving blog:", err);
    alert("Failed to save blog.");
  }
}


document.getElementById("submitBlogBtn").addEventListener("click", (e) => {
  e.preventDefault();
  saveBlog();
});

document.getElementById("downloadPdfBtn").addEventListener("click", (e) => {
  e.preventDefault();
  saveBlogAsPDF();
});



function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
const debouncedAI = debounce(() => {
  fetchTitleSuggestion();
  fetchContentSuggestion();
  fetchImageSuggestions();
}, 800);

titleInput.addEventListener('input', debouncedAI);
