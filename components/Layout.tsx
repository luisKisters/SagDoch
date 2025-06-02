import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-1/6 bg-[#FF005C]">
        {/* Top section content can go here if needed globally */}
      </header>
      <main className="flex-grow bg-[#0F0F1B]">{children}</main>
      <footer className="h-1/6 bg-[#00FFC6]">
        {/* Bottom section content can go here if needed globally */}
      </footer>
    </div>
  );
};

export default Layout;
