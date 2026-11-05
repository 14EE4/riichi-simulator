/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mah-gen': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-seq'?: string
        'data-river-mode'?: boolean
        'data-show-err'?: boolean
      }
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mah-gen': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-seq'?: string
        'data-river-mode'?: boolean
        'data-show-err'?: boolean
      }
    }
  }
}

export {}
