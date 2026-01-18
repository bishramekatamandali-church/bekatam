import React, { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

type CountryCode = { code: string; name: string };

// Keep a minimal + safe list (you can expand later)
const RAW_COUNTRY_CODES: CountryCode[] = [
  { code: "+977", name: "Nepal" },
  { code: "+91", name: "India" },
  { code: "+1", name: "United States" },
  { code: "+44", name: "United Kingdom" },
  { code: "+61", name: "Australia" },
  { code: "+81", name: "Japan" },
  { code: "+49", name: "Germany" },
];

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();

  const countryCodes = useMemo(() => {
    // Defensive: avoid localeCompare crash if any bad data slips in
    return [...RAW_COUNTRY_CODES]
      .filter((c) => c && typeof c.name === "string" && typeof c.code === "string")
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(countryCodes[0]?.code || "+977");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";
    if (!email.includes("@")) return "Please enter a valid email.";
    if (!countryCode.trim()) return "Please select a country code.";
    if (!phone.trim()) return "Please enter your phone number.";
    // Basic phone sanity
    if (!/^[0-9]{6,15}$/.test(phone.trim()))
      return "Phone must be 6–15 digits (numbers only).";
    if (!password) return "Please enter a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    setLoading(true);
    try {
      const ok = await register(
        fullName.trim(),
        email.trim().toLowerCase(),
        countryCode.trim(),
        phone.trim(),
        password
      );

      if (!ok) {
        setErrorMsg("Registration failed. Email or phone may already be used.");
        return;
      }

      setSuccessMsg("Registration successful! You can now login.");
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setErrorMsg("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Secondary nav inside auth screen */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Create Account</h2>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-medium text-amber-600 hover:text-amber-500"
        >
          Go to Login
        </button>
      </div>

      {errorMsg && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <div className="mt-1 flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-44 rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              {countryCodes.map((c) => (
                <option key={c.code + c.name} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="98xxxxxxxx"
              autoComplete="tel"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Digits only (6–15). Example: 9865xxxxxx
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Re-type password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
