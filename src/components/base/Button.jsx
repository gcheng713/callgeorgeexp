import ScaleLoader from "react-spinners/ScaleLoader";

const Button = ({ label, onClick, isLoading, disabled }) => {
  const opacity = disabled ? 0.75 : 1;
  const cursor = disabled ? "not-allowed" : "pointer";

  const Contents = isLoading ? (
    <ScaleLoader
      color="#000"
      height={10}
      width={2.5}
      margin={0.5}
      loading={true}
      size={50}
      css={{ display: "block", margin: "0 auto" }}
    />
  ) : (
    <p style={{ margin: 0, padding: 0 }}>{label}</p>
  );

  return (
    <button
      onClick={onClick}
      style={{
        background: "linear-gradient(to right, #4facfe, #00f2fe)",
        color: "white",
        border: "none",
        borderRadius: "50px",
        padding: "12px 24px",
        fontSize: "18px",
        outline: "none",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
        transition: "all 0.3s ease",
        opacity,
        cursor,
      }}
    >
      {Contents}
    </button>
  );
};

export default Button;
