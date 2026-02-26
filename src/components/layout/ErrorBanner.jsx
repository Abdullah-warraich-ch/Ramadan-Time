function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-bold tracking-widest">
      {message}
    </div>
  );
}

export default ErrorBanner;
