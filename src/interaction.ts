import { canvas } from "./common";
import { offset, queRender, zoom } from "./main";

document.addEventListener("wheel", (event) => {
  event.preventDefault();

  const zoomIntensity = 0.1;
  const { clientX, clientY, deltaY } = event;

  // Get mouse position in world coordinates before zoom
  const worldX = (clientX - offset.x) / zoom.value;
  const worldY = (clientY - offset.y) / zoom.value;

  // Zoom in or out
  const zoomFactor = 1 - deltaY * zoomIntensity / 100;
  zoom.value *= zoomFactor;

  // Adjust offset to keep the mouse position stationary
  offset.x = clientX - worldX * zoom.value;
  offset.y = clientY - worldY * zoom.value;

  queRender();
}, {
  passive: false
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  let { clientX: startX, clientY: startY } = event;

  let isDragging = true;
  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging) return;

    const { clientX, clientY } = moveEvent;
    const dx = clientX - startX;
    const dy = clientY - startY;

    offset.x += dx;
    offset.y += dy;

    queRender();

    // Update start position for next move
    startX = clientX;
    startY = clientY;
  }

  const onMouseUp = () => {
    isDragging = false;
    canvas.removeEventListener("pointermove", onMouseMove);
    canvas.removeEventListener("pointerup", onMouseUp);
  }

  canvas.addEventListener("pointermove", onMouseMove);
  canvas.addEventListener("pointerup", onMouseUp, { once: true });
});