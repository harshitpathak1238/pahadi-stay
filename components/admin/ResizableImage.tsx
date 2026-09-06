'use client';

import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { useEffect, useRef } from 'react';

type ImageAttrs = { src: string; alt?: string; title?: string; width?: number | string | null; height?: number | string | null };

function ResizableImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as ImageAttrs;
  const start = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const resize = (event: PointerEvent) => {
    if (!start.current) return;
    const ratio = start.current.width / Math.max(start.current.height, 1);
    const width = Math.max(80, Math.round(start.current.width + event.clientX - start.current.x));
    updateAttributes({ width, height: Math.max(40, Math.round(width / ratio)) });
  };
  const stop = () => {
    start.current = null;
    window.removeEventListener('pointermove', resize);
    window.removeEventListener('pointerup', stop);
  };
  useEffect(() => () => stop(), []);
  const begin = (event: React.PointerEvent) => {
    event.preventDefault();
    const image = imageRef.current;
    if (!image) return;
    start.current = { x: event.clientX, y: event.clientY, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height };
    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', stop);
  };
  return <NodeViewWrapper className={`relative inline-block max-w-full ${selected ? 'ring-2 ring-[#8db9a0]' : ''}`}>
    <img ref={imageRef} src={attrs.src} alt={attrs.alt || ''} title={attrs.title || ''} width={attrs.width || undefined} height={attrs.height || undefined} style={{ width: attrs.width ? `${attrs.width}px` : undefined, height: attrs.height ? `${attrs.height}px` : undefined }} className="max-w-full" />
    {selected && <button type="button" aria-label="Resize image" onPointerDown={begin} className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize border-2 border-white bg-[#24584a] shadow" />}
  </NodeViewWrapper>;
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('width') || null, renderHTML: (attributes: { width?: number | string | null }) => attributes.width ? { width: attributes.width } : {} },
      height: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('height') || null, renderHTML: (attributes: { height?: number | string | null }) => attributes.height ? { height: attributes.height } : {} },
    };
  },
  addNodeView() { return ReactNodeViewRenderer(ResizableImageView); },
});