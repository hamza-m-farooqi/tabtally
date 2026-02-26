"use client";

export default function Spinner({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  return (
    <span className={`spinner spinner-${size} ${className}`} aria-label={label} />
  );
}
