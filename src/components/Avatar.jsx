// src/components/Avatar.jsx

function Avatar({ user, size = 32 }) {
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}

export default Avatar;
