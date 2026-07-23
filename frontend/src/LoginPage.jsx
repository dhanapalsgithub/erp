import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function LoginPage({ onLogin }) {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const staffList = ["Admin", "Hari", "Kastur", "Suresh", "Raj"];

  const handleLogin = () => {
    if (!selectedStaff) { alert("Please select a user"); return; }
    if (selectedStaff === "Admin" && password !== "admin123") { alert("Incorrect Admin Password!"); return; }
    
    onLogin({ name: selectedStaff, role: selectedStaff === "Admin" ? "admin" : "staff" });
    navigate("/dashboard");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a192f]"
      style={{
        // உங்கள் பின்னணிப் படம் - இங்கு ஒரு தொழில்நுட்பப் படத்தின் லிங்க் கொடுக்கப்பட்டுள்ளது
        backgroundImage: "linear-gradient(rgba(10, 25, 47, 0.85), rgba(10, 25, 47, 0.85)), url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* CAD/Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(#64ffda 1px, transparent 1px)", backgroundSize: "30px 30px" }}>
      </div>

      {/* Glassmorphism Container */}
      <div className="relative p-8 border border-[#64ffda] rounded-xl shadow-[0_0_20px_rgba(100,255,218,0.2)] bg-[#112240]/80 backdrop-blur-sm w-96 text-white">
        
        {/* லோகோ பகுதி - Engineering Icon */}
       {/* லோகோ பகுதி - உங்கள் லோகோ கோப்புடன் */}
<div className="flex flex-col items-center mb-8">
  <div className="w-24 h-24 border-2 border-[#64ffda] rounded-lg flex items-center justify-center mb-4 rotate-45 overflow-hidden animate-[spin_10s_linear_infinite]">
    <img 
      src={logo} 
      alt="Company Logo" 
      className="w-full h-full object-cover -rotate-45" 
    />
  </div>
  <h1 className="text-2xl font-bold text-[#64ffda] tracking-[0.2em]">RAPID TECH</h1>
  <p className="text-[10px] text-gray-400 tracking-widest mt-1">mechpulse</p>
</div>
        <Select onValueChange={setSelectedStaff}>
          <SelectTrigger className="mb-4 bg-[#0a192f] border-[#64ffda]/30 text-white">
            <SelectValue placeholder="Select Staff ID" />
          </SelectTrigger>
          <SelectContent className="bg-[#112240] border-[#64ffda]/30">
            {staffList.map((name) => (
              <SelectItem key={name} value={name} className="text-white hover:bg-[#233554]">{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStaff === "Admin" && (
          <Input 
            type="password" 
            placeholder="Security Key" 
            className="mb-4 bg-[#0a192f] border-[#64ffda]/30 text-white placeholder:text-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <Button 
          onClick={handleLogin} 
          className="w-full bg-transparent border border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda]/10 font-bold tracking-widest"
        >
          INITIALIZE SYSTEM
        </Button>
      </div>
    </div>
  );
}