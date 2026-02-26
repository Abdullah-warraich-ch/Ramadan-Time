function AppBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url(/bg.avif)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
    </div>
  );
}

export default AppBackground;
