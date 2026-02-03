/**
 * Responsive YouTube Embed
 * Creates a responsive YouTube player with lazy loading
 * 
 * Usage:
 * <div class="youtube-embed" data-video-id="dQw4w9WgXcQ"></div>
 */

class YouTubeEmbed {
  constructor(element) {
    this.element = element;
    this.videoId = element.dataset.videoId;
    this.thumbnail = element.dataset.thumbnail || `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`;
    
    this.init();
  }

  init() {
    // Create wrapper with aspect ratio
    this.element.classList.add('youtube-embed-wrapper');
    
    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.src = this.thumbnail;
    thumbnail.alt = 'Video thumbnail';
    thumbnail.className = 'youtube-thumbnail';
    
    // Create play button
    const playButton = document.createElement('button');
    playButton.className = 'youtube-play-button';
    playButton.setAttribute('aria-label', 'Play video');
    playButton.innerHTML = `
      <svg viewBox="0 0 68 48" width="68" height="48">
        <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
        <path d="M 45,24 27,14 27,34" fill="#fff"></path>
      </svg>
    `;
    
    // Add elements to DOM
    this.element.appendChild(thumbnail);
    this.element.appendChild(playButton);
    
    // Handle click
    playButton.addEventListener('click', () => this.loadVideo());
  }

  loadVideo() {
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${this.videoId}?autoplay=1&rel=0`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.className = 'youtube-iframe';
    
    // Replace content with iframe
    this.element.innerHTML = '';
    this.element.appendChild(iframe);
  }
}

// Auto-initialize all YouTube embeds
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.youtube-embed').forEach(element => {
    new YouTubeEmbed(element);
  });
});