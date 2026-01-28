import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

type CountryCode = { code: string; name: string };

const RAW_COUNTRY_CODES: CountryCode[] = [
  { code: "+93", name: "Afghanistan" },
  { code: "+213", name: "Algeria" },
  { code: "+61", name: "Australia" },
  { code: "+43", name: "Austria" },
  { code: "+973", name: "Bahrain" },
  { code: "+880", name: "Bangladesh" },
  { code: "+32", name: "Belgium" },
  { code: "+55", name: "Brazil" },
  { code: "+1", name: "Canada" },
  { code: "+86", name: "China" },
  { code: "+57", name: "Colombia" },
  { code: "+45", name: "Denmark" },
  { code: "+20", name: "Egypt" },
  { code: "+33", name: "France" },
  { code: "+49", name: "Germany" },
  { code: "+30", name: "Greece" },
  { code: "+852", name: "Hong Kong" },
  { code: "+91", name: "India" },
  { code: "+62", name: "Indonesia" },
  { code: "+98", name: "Iran" },
  { code: "+964", name: "Iraq" },
  { code: "+353", name: "Ireland" },
  { code: "+972", name: "Israel" },
  { code: "+39", name: "Italy" },
  { code: "+81", name: "Japan" },
  { code: "+962", name: "Jordan" },
  { code: "+7", name: "Kazakhstan" },
  { code: "+965", name: "Kuwait" },
  { code: "+60", name: "Malaysia" },
  { code: "+52", name: "Mexico" },
  { code: "+212", name: "Morocco" },
  { code: "+977", name: "Nepal" },
  { code: "+64", name: "New Zealand" },
  { code: "+234", name: "Nigeria" },
  { code: "+47", name: "Norway" },
  { code: "+92", name: "Pakistan" },
  { code: "+507", name: "Panama" },
  { code: "+51", name: "Peru" },
  { code: "+63", name: "Philippines" },
  { code: "+48", name: "Poland" },
  { code: "+351", name: "Portugal" },
  { code: "+974", name: "Qatar" },
  { code: "+40", name: "Romania" },
  { code: "+7", name: "Russia" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+65", name: "Singapore" },
  { code: "+27", name: "South Africa" },
  { code: "+82", name: "South Korea" },
  { code: "+34", name: "Spain" },
  { code: "+94", name: "Sri Lanka" },
  { code: "+46", name: "Sweden" },
  { code: "+41", name: "Switzerland" },
  { code: "+66", name: "Thailand" },
  { code: "+90", name: "Turkey" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+44", name: "United Kingdom" },
  { code: "+1", name: "United States" },
  { code: "+84", name: "Vietnam" },
];

const ISO_TO_COUNTRY_CODE: Record<string, string> = {
  AE: "+971",
  AF: "+93",
  AU: "+61",
  BD: "+880",
  BR: "+55",
  CA: "+1",
  CN: "+86",
  DE: "+49",
  EG: "+20",
  ES: "+34",
  FR: "+33",
  GB: "+44",
  GR: "+30",
  IN: "+91",
  IQ: "+964",
  IR: "+98",
  IT: "+39",
  JP: "+81",
  KR: "+82",
  LK: "+94",
  MX: "+52",
  MY: "+60",
  NP: "+977",
  NZ: "+64",
  PK: "+92",
  PH: "+63",
  QA: "+974",
  RU: "+7",
  SA: "+966",
  SE: "+46",
  SG: "+65",
  TH: "+66",
  TR: "+90",
  US: "+1",
  VN: "+84",
};

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

  const detectCountryCode = (): string | null => {
    const locale = navigator.language || "";
    const regionFromLocale = locale.split("-")[1];
    if (regionFromLocale && ISO_TO_COUNTRY_CODE[regionFromLocale.toUpperCase()]) {
      return ISO_TO_COUNTRY_CODE[regionFromLocale.toUpperCase()];
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz?.startsWith("Asia/Kathmandu")) return "+977";
    if (tz?.startsWith("America/")) return "+1";
    if (tz?.startsWith("Europe/London")) return "+44";

    return null;
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(countryCodes[0]?.code || "+977");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageDataUrl, setProfileImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const detected = detectCountryCode();
    if (detected && countryCodes.some((c) => c.code === detected)) {
      setCountryCode(detected);
    }
  }, [countryCodes]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      setProfileImageDataUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(objectUrl);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(profileImageFile);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";
    if (!email.includes("@")) return "Please enter a valid email.";
    if (phone.trim()) {
      if (!countryCode.trim()) return "Please select a country code.";
      // Basic phone sanity
      if (!/^[0-9]{6,15}$/.test(phone.trim()))
        return "Phone must be 6–15 digits (numbers only).";
    }
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
        phone.trim() ? countryCode.trim() : "",
        phone.trim(),
        password,
        profileImageDataUrl ?? undefined
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
          <label className="block text-sm font-medium text-gray-700">
            Profile Picture (optional)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Selected profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  No photo
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Add a profile photo from your device or camera. You can update this later with OTP
            verification.
          </p>
        </div>

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
          <p className="mt-1 text-xs text-gray-500">
            You can update your email later using OTP verification.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone (optional, recommended)
          </label>
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
            Auto-detected country code based on your location. Digits only (6–15). Example:
            9865xxxxxx. You can update your phone later using OTP verification.
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
