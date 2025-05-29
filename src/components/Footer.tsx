export default function Footer() {
  return (
    <footer className="py-6 px-6 mt-auto bg-card border-t border-border">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} File Drop Zone. All rights reserved.</p>
        <p>Files are automatically deleted from the system after 24 hours.</p>
      </div>
    </footer>
  );
}
