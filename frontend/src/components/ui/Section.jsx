import Container from "./Container";

export default function Section({
  children,
  className = "",
  containerClassName = "",
  background = "none", // "none" | "white" | "gray"
}) {
  

  return (
    <section className={`${background} ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
