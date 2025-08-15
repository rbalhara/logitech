export default function decorate(block) {
  const blockImages = block.querySelectorAll('picture');

  // media query match that indicates mobile/tablet width
  const isDesktop = window.matchMedia('(min-width: 767px)');

  function toggleImage() {
    const mobileImage = blockImages[1];
    const desktopImage = blockImages[0];

    if (isDesktop.matches) {
      mobileImage.closest('div').className = 'hidden';
      desktopImage.closest('div').className = '';
    } else {
      desktopImage.closest('div').className = 'hidden';
      mobileImage.closest('div').className = '';
    }
  }

  window.addEventListener('load', toggleImage());
  isDesktop.addEventListener('change', () => toggleImage());
}
