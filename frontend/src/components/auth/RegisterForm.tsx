/*
import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { EyeIcon, EyeSlashIcon, CameraIcon } from '../icons/GenericIcons';
import SocialLoginButtons from './SocialLoginButtons';
import { RegistrationFormData } from '../../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

const CLOUDINARY_CLOUD_NAME = 'dl94nfxom';
const CLOUDINARY_UPLOAD_PRESET = 'bishram_ekata_mandali';

const countryCodes = [
  { code: '+977', name: 'Nepal (+977)' },
  { code: '+91', name: 'India (+91)' },
  { code: '+1', name: 'United States (+1)' },
  { code: '+44', name: 'United Kingdom (+44)' },
  { code: '+61', name: 'Australia (+61)' },
  { code: '+86', name: 'China (+86)' },
  { code: '+81', name: 'Japan (+81)' },
  { code: '+49', name: 'Germany (+49)' },
  { code: '+33', name: 'France (+33)' },
  { code: '+55', name: 'Brazil (+55)' },
  { code: '+27', name: 'South Africa (+27)' },
  { code: '+7', name: 'Russia (+7)' },
  { code: '+39', name: 'Italy (+39)' },
  { code: '+34', name: 'Spain (+34)' },
  { code: '+64', name: 'New Zealand (+64)' },
  { code: '+65', name: 'Singapore (+65)' },
  { code: '+82', name: 'South Korea (+82)' },
  { code: '+46', name: 'Sweden (+46)' },
  { code: '+41', name: 'Switzerland (+41)' },
  { code: '+971', name: 'UAE (+971)' },
  { code: '+234', name: 'Nigeria (+234)' },
  { code: '+20', name: 'Egypt (+20)' },
  { code: '+52', name: 'Mexico (+52)' },
  { code: '+54', name: 'Argentina (+54)' },
  { code: '+60', name: 'Malaysia (+60)' },
  { code: '+62', name: 'Indonesia (+62)' },
  { code: '+66', name: 'Thailand (+66)' },
  { code: '+84', name: 'Vietnam (+84)' },
  { code: '+90', name: 'Turkey (+90)' },
  { code: '+92', name: 'Pakistan (+92)' },
  { code: '+880', name: 'Bangladesh (+880)' },
  { code: '+31', name: 'Netherlands (+31)' },
  { code: '+32', name: 'Belgium (+32)' },
  { code: '+351', name: 'Portugal (+351)' },
  { code: '+353', name: 'Ireland (+353)' },
  { code: '+43', name: 'Austria (+43)' },
  { code: '+45', name: 'Denmark (+45)' },
  { code: '+47', name: 'Norway (+47)' },
  { code: '+48', name: 'Poland (+48)' },
  { code: '+212', name: 'Morocco (+212)' },
  { code: '+254', name: 'Kenya (+254)' },
  { code: '+233', name: 'Ghana (+233)' },
  { code: '+63', name: 'Philippines (+63)' },
  { code: '+94', name: 'Sri Lanka (+94)' },
  { code: '+966', name: 'Saudi Arabia (+966)' },
  { code: '+972', name: 'Israel (+972)' },
  { code: '+51', name: 'Peru (+51)' },
  { code: '+56', name: 'Chile (+56)' },
  { code: '+57', name: 'Colombia (+57)' },
  { code: '+58', name: 'Venezuela (+58)' },
  { code: '+852', name: 'Hong Kong (+852)' },
  { code: '+886', name: 'Taiwan (+886)' },
  // Expanded List
  { code: '+93', name: 'Afghanistan (+93)' },
  { code: '+355', name: 'Albania (+355)' },
  { code: '+213', name: 'Algeria (+213)' },
  { code: '+376', name: 'Andorra (+376)' },
  { code: '+244', name: 'Angola (+244)' },
  { code: '+1268', name: 'Antigua and Barbuda (+1268)' },
  { code: '+374', name: 'Armenia (+374)' },
  { code: '+297', name: 'Aruba (+297)' },
  { code: '+994', name: 'Azerbaijan (+994)' },
  { code: '+1242', name: 'Bahamas (+1242)' },
  { code: '+973', name: 'Bahrain (+973)' },
  { code: '+1246', name: 'Barbados (+1246)' },
  { code: '+375', name: 'Belarus (+375)' },
  { code: '+501', name: 'Belize (+501)' },
  { code: '+229', name: 'Benin (+229)' },
  { code: '+975', name: 'Bhutan (+975)' },
  { code: '+591', name: 'Bolivia (+591)' },
  { code: '+387', name: 'Bosnia and Herzegovina (+387)' },
  { code: '+267', name: 'Botswana (+267)' },
  { code: '+673', name: 'Brunei (+673)' },
  { code: '+359', name: 'Bulgaria (+359)' },
  { code: '+226', name: 'Burkina Faso (+226)' },
  { code: '+257', name: 'Burundi (+257)' },
  { code: '+855', name: 'Cambodia (+855)' },
  { code: '+237', name: 'Cameroon (+237)' },
  { code: '+238', name: 'Cape Verde (+238)' },
  { code: '+236', name: 'Central African Republic (+236)' },
  { code: '+235', name: 'Chad (+235)' },
  { code: '+269', name: 'Comoros (+269)' },
  { code: '+242', name: 'Congo - Brazzaville (+242)' },
  { code: '+243', name: 'Congo - Kinshasa (+243)' },
  { code: '+506', name: 'Costa Rica (+506)' },
  { code: '+225', name: 'Côte d’Ivoire (+225)' },
  { code: '+385', name: 'Croatia (+385)' },
  { code: '+53', name: 'Cuba (+53)' },
  { code: '+357', name: 'Cyprus (+357)' },
  { code: '+420', name: 'Czechia (+420)' },
  { code: '+253', name: 'Djibouti (+253)' },
  { code: '+1767', name: 'Dominica (+1767)' },
  { code: '+1809', name: 'Dominican Republic (+1809)' }, // and +1829, +1849
  { code: '+593', name: 'Ecuador (+593)' },
  { code: '+503', name: 'El Salvador (+503)' },
  { code: '+240', name: 'Equatorial Guinea (+240)' },
  { code: '+291', name: 'Eritrea (+291)' },
  { code: '+372', name: 'Estonia (+372)' },
  { code: '+268', name: 'Eswatini (+268)' },
  { code: '+251', name: 'Ethiopia (+251)' },
  { code: '+679', name: 'Fiji (+679)' },
  { code: '+358', name: 'Finland (+358)' },
  { code: '+241', name: 'Gabon (+241)' },
  { code: '+220', name: 'Gambia (+220)' },
  { code: '+995', name: 'Georgia (+995)' },
  { code: '+30', name: 'Greece (+30)' },
  { code: '+1473', name: 'Grenada (+1473)' },
  { code: '+502', name: 'Guatemala (+502)' },
  { code: '+224', name: 'Guinea (+224)' },
  { code: '+245', name: 'Guinea-Bissau (+245)' },
  { code: '+592', name: 'Guyana (+592)' },
  { code: '+509', name: 'Haiti (+509)' },
  { code: '+504', name: 'Honduras (+504)' },
  { code: '+36', name: 'Hungary (+36)' },
  { code: '+354', name: 'Iceland (+354)' },
  { code: '+98', name: 'Iran (+98)' },
  { code: '+964', name: 'Iraq (+964)' },
  { code: '+1876', name: 'Jamaica (+1876)' },
  { code: '+962', name: 'Jordan (+962)' },
  { code: '+7', name: 'Kazakhstan (+7)' }, // Shares with Russia
  { code: '+965', name: 'Kuwait (+965)' },
  { code: '+996', name: 'Kyrgyzstan (+996)' },
  { code: '+856', name: 'Laos (+856)' },
  { code: '+371', name: 'Latvia (+371)' },
  { code: '+961', name: 'Lebanon (+961)' },
  { code: '+266', name: 'Lesotho (+266)' },
  { code: '+231', name: 'Liberia (+231)' },
  { code: '+218', name: 'Libya (+218)' },
  { code: '+423', name: 'Liechtenstein (+423)' },
  { code: '+370', name: 'Lithuania (+370)' },
  { code: '+352', name: 'Luxembourg (+352)' },
  { code: '+261', name: 'Madagascar (+261)' },
  { code: '+265', name: 'Malawi (+265)' },
  { code: '+960', name: 'Maldives (+960)' },
  { code: '+223', name: 'Mali (+223)' },
  { code: '+356', name: 'Malta (+356)' },
  { code: '+222', name: 'Mauritania (+222)' },
  { code: '+230', name: 'Mauritius (+230)' },
  { code: '+373', name: 'Moldova (+373)' },
  { code: '+377', name: 'Monaco (+377)' },
  { code: '+976', name: 'Mongolia (+976)' },
  { code: '+382', name: 'Montenegro (+382)' },
  { code: '+258', name: 'Mozambique (+258)' },
  { code: '+95', name: 'Myanmar (+95)' },
  { code: '+264', name: 'Namibia (+264)' },
  { code: '+370', name: 'Nauru (+674)' }, // Corrected Nauru code
  { code: '+227', name: 'Niger (+227)' },
  { code: '+389', name: 'North Macedonia (+389)' },
  { code: '+968', name: 'Oman (+968)' },
  { code: '+680', name: 'Palau (+680)' },
  { code: '+970', name: 'Palestine (+970)' },
  { code: '+507', name: 'Panama (+507)' },
  { code: '+675', name: 'Papua New Guinea (+675)' },
  { code: '+595', name: 'Paraguay (+595)' },
  { code: '+351', name: 'Portugal (+351)' }, // Duplicate, already above
  { code: '+974', name: 'Qatar (+974)' },
  { code: '+40', name: 'Romania (+40)' },
  { code: '+250', name: 'Rwanda (+250)' },
  { code: '+290', name: 'Saint Helena (+290)' },
  { code: '+1869', name: 'Saint Kitts and Nevis (+1869)' },
  { code: '+1758', name: 'Saint Lucia (+1758)' },
  { code: '+1784', name: 'Saint Vincent and the Grenadines (+1784)' },
  { code: '+685', name: 'Samoa (+685)' },
  { code: '+378', name: 'San Marino (+378)' },
  { code: '+239', name: 'São Tomé and Príncipe (+239)' },
  { code: '+221', name: 'Senegal (+221)' },
  { code: '+381', name: 'Serbia (+381)' },
  { code: '+248', name: 'Seychelles (+248)' },
  { code: '+232', name: 'Sierra Leone (+232)' },
  { code: '+421', name: 'Slovakia (+421)' },
  { code: '+386', name: 'Slovenia (+386)' },
  { code: '+677', name: 'Solomon Islands (+677)' },
  { code: '+252', name: 'Somalia (+252)' },
  { code: '+211', name: 'South Sudan (+211)' },
  { code: '+249', name: 'Sudan (+249)' },
  { code: '+597', name: 'Suriname (+597)' },
  { code: '+963', name: 'Syria (+963)' },
  { code: '+992', name: 'Tajikistan (+992)' },
  { code: '+255', name: 'Tanzania (+255)' },
  { code: '+228', name: 'Togo (+228)' },
  { code: '+676', name: 'Tonga (+676)' },
  { code: '+1868', name: 'Trinidad and Tobago (+1868)' },
  { code: '+216', name: 'Tunisia (+216)' },
  { code: '+993', name: 'Turkmenistan (+993)' },
  { code: '+688', name: 'Tuvalu (+688)' },
  { code: '+256', name: 'Uganda (+256)' },
  { code: '+380', name: 'Ukraine (+380)' },
  { code: '+598', name: 'Uruguay (+598)' },
  { code: '+998', name: 'Uzbekistan (+998)' },
  { code: '+678', name: 'Vanuatu (+678)' },
  { code: '+379', name: 'Vatican City (+379)' },
  { code: '+967', name: 'Yemen (+967)' },
  { code: '+260', name: 'Zambia (+260)' },
  { code: '+263', name: 'Zimbabwe (+263)' },
];


export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    countryCode: '+977',
    phone: '',
    profileImageUrl: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { register } = useAuth();
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(`Uploading ${file.name}...`);
    setError('');
    const uploadFormDataBody = new FormData();
    uploadFormDataBody.append('file', file);
    uploadFormDataBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadFormDataBody,
        mode: 'cors',
      });
      const data = await response.json();

      if (response.ok && data.secure_url) {
        setFormData(prev => ({ ...prev, profileImageUrl: data.secure_url }));
        setUploading("Upload successful!");
        setTimeout(() => setUploading(null), 2000);
      } else {
        const errorMessage = `Upload failed: ${data.error?.message || 'Unknown error'}`;
        setUploading(errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = `Upload error: ${error.message || 'An unknown error occurred.'}`;
      setUploading(errorMessage);
      setError(errorMessage);
    } finally {
      if(imageUploadRef.current) imageUploadRef.current.value = ''; // Reset file input
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const passwordErrors = [];
    if (password.length < 6) {
        passwordErrors.push("Password must be at least 6 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
        passwordErrors.push("Password must contain at least one capital letter.");
    }
    if (!/[0-9]/.test(password)) {
        passwordErrors.push("Password must contain at least one number.");
    }

    if (passwordErrors.length > 0) {
        setError(passwordErrors.join(" "));
        setLoading(false);
        return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const success = await register(
        formData.fullName,
        formData.email,
        formData.countryCode,
        formData.phone,
        password,
        formData.profileImageUrl || undefined
      );
      if (success) {
        setSuccessMessage("Registration successful! You are now logged in.");
        onRegisterSuccess(); 
      } else {
        setError("Failed to register. Email may already be in use or another error occurred.");
      }
    } catch (err) {
      setError("Failed to register. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label htmlFor="register-fullName" className="block text-xs font-medium text-slate-700">Full Name</label>
        <input
          type="text" id="register-fullName" name="fullName" value={formData.fullName}
          onChange={handleChange} required autoComplete="name"
          className="mt-1 block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="register-email" className="block text-xs font-medium text-slate-700">Email Address</label>
        <input
          type="email" id="register-email" name="email" value={formData.email}
          onChange={handleChange} required autoComplete="email"
          className="mt-1 block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="register-phone" className="block text-xs font-medium text-slate-700">Phone Number (Optional)</label>
        <div className="mt-1 flex rounded-xl shadow-sm">
            <select 
                name="countryCode" 
                id="register-countryCode" 
                value={formData.countryCode} 
                onChange={handleChange}
                className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm focus:ring-amber-500 focus:border-amber-500"
            >
                {countryCodes.sort((a,b) => a.name.localeCompare(b.name)).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <input
                type="tel" name="phone" id="register-phone" value={formData.phone}
                onChange={handleChange} autoComplete="tel-national"
                className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-xl border-slate-300 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
        </div>
      </div>
       <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">Profile Picture (Optional)</label>
          <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  {formData.profileImageUrl ? (
                      <img src={formData.profileImageUrl} alt="Profile preview" className="w-16 h-16 rounded-full object-cover"/>
                  ) : (
                      <CameraIcon className="w-8 h-8 text-slate-400" />
                  )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} ref={imageUploadRef} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => imageUploadRef.current?.click()} disabled={!!uploading}>
                  {uploading ? "Uploading..." : "Upload Image"}
              </Button>
          </div>
          {uploading && <p className="text-xs text-slate-500 mt-1">{uploading}</p>}
      </div>

       <div>
        <label htmlFor="register-password" className="block text-xs font-medium text-slate-700">Password</label>
        <div className="relative mt-1">
            <input
                type={showPassword ? 'text' : 'password'} id="register-password" name="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                className="block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-xs font-medium text-slate-700">Confirm Password</label>
        <div className="relative mt-1">
            <input
                type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" name="confirmPassword" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                className="block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
             <button
              type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {successMessage && <p className="text-sm text-green-600" role="alert">{successMessage}</p>}
      
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </Button>
      <p className="text-sm text-center text-slate-600">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-amber-600 hover:text-amber-500">
          Login here
        </button>
      </p>
      </form>
      <SocialLoginButtons onSocialLoginSuccess={onRegisterSuccess} />
    </>
  );
}; */




import React, { useState } from "react";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+977"); // Default Nepal
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const countryCodes = [
    "+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34",
    "+39", "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48",
    "+49", "+51", "+52", "+53", "+54", "+55", "+56", "+57", "+58",
    "+60", "+61", "+62", "+63", "+64", "+65", "+66", "+81", "+82",
    "+84", "+86", "+90", "+91", "+92", "+93", "+94", "+95", "+98",
    "+211", "+212", "+213", "+216", "+218", "+220", "+221", "+222",
    "+223", "+224", "+225", "+226", "+227", "+228", "+229", "+230",
    "+231", "+232", "+233", "+234", "+235", "+236", "+237", "+238",
    "+239", "+240", "+241", "+242", "+243", "+244", "+245", "+246",
    "+248", "+249", "+250", "+251", "+252", "+253", "+254", "+255",
    "+256", "+257", "+258", "+260", "+261", "+262", "+263", "+264",
    "+265", "+266", "+267", "+268", "+269", "+290", "+291", "+297",
    "+298", "+299", "+350", "+351", "+352", "+353", "+354", "+355",
    "+356", "+357", "+358", "+359", "+370", "+371", "+372", "+373",
    "+374", "+375", "+376", "+377", "+378", "+380", "+381", "+382",
    "+385", "+386", "+387", "+389", "+420", "+421", "+423"
  ];

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill all required fields.");
      setLoading(false);
      return;
    }

    const result = await register(
      fullName,
      email,
      countryCode,
      phone,
      password
    );

    if (!result) {
      setError("Registration failed. Email may already exist.");
      setLoading(false);
      return;
    }

    setSuccess("Registration successful! You're now logged in.");
    setLoading(false);

    if (onRegisterSuccess) {
      onRegisterSuccess();
    }
  };

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <h2 className="text-lg font-bold text-center">Create New Account</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* Full Name */}
      <div>
        <label className="block text-xs mb-1">Full Name *</label>
        <input
          type="text"
          className="w-full border p-2 rounded-md"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs mb-1">Email *</label>
        <input
          type="email"
          className="w-full border p-2 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs mb-1">Phone (optional)</label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="border p-2 rounded-md"
          >
            {countryCodes.map((code, index) => (
              <option key={`${code}-${index}`} value={code}>
                {code}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="flex-1 border p-2 rounded-md"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs mb-1">Password *</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border p-2 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="absolute right-3 top-2 text-sm"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Creating Account..." : "Register"}
      </Button>

      <p className="text-sm text-center">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-amber-600 font-medium"
        >
          Login
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
