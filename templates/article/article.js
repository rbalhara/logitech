export default function decorate(block) {
  const mainContent = block.querySelector('.section:nth-of-type(2)');
  const recentNewsContent = block.querySelector('.section:nth-of-type(3)');
  if (!mainContent || !recentNewsContent) {
    return;
  }

  mainContent.classList.add('content');
  const div = document.createElement('div');
  div.className = 'container';
  div.innerHTML = recentNewsContent.innerHTML;
  recentNewsContent.remove();
  mainContent.appendChild(div);
}
