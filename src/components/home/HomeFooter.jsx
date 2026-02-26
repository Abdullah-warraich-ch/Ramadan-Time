function HomeFooter({ hadithText }) {
  return (
    <footer className="w-full text-center px-4 pb-4">
      <p className="text-white/20 italic text-[10px] md:text-xs font-light leading-snug max-w-sm mx-auto">
        "{hadithText ?? "May your fast be accepted."}"
      </p>
    </footer>
  );
}

export default HomeFooter;
