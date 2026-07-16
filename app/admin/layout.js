export const metadata = {
  title: 'OI Admin — Ship Orders',
  description: 'OI Body Chemistry Admin Portal',
  manifest: '/admin-manifest.json',
  themeColor: '#050505',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OI Admin',
  },
}

export default function AdminLayout({ children }) {
  return (
    <>
      <head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#050505" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OI Admin" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/admin-sw.js');
              });
            }
          `
        }} />
      </head>
      {children}
    </>
  )
}