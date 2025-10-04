import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config";


function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setCurrentAccount(accounts[0]);
      } catch (error) {
        console.error("User rejected request:", error);
        alert("Failed to connect wallet.");
      }
    } else {
      alert("MetaMask not detected!");
    }
  };

  // Get Contract instance
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  // Add Student
  const handleAddStudent = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!name || !email || !course) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.addStudent(name, email, course);
      await tx.wait();

      const studentCount = await contract.studentCount();
      const newStudentId = Number(studentCount) - 1;
      setStudentId(newStudentId.toString());
      setStudent(null); // Clear previous student view

      alert(`✅ Student added! ID: ${newStudentId}`);
      setName("");
      setEmail("");
      setCourse("");
    } catch (err) {
      console.error("Add student error:", err);
      alert("Failed to add student. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Authorize current account as approver
  const authorizeMe = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.authorizeApprover(currentAccount);
      await tx.wait();
      alert("✅ You are now an authorized approver!");
    } catch (err) {
      console.error("Authorization error:", err);
      alert("Failed to authorize. Are you the contract owner?");
    } finally {
      setLoading(false);
    }
  };

  // Request Recommendation
  const handleRequest = async () => {
    if (!studentId) {
      alert("Please enter a Student ID.");
      return;
    }
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.requestRecommendation(studentId);
      await tx.wait();
      alert("✅ Recommendation requested!");
      fetchStudentDetails(studentId); // Auto-refresh
    } catch (err) {
      console.error("Request error:", err);
      alert("Failed to request recommendation.");
    } finally {
      setLoading(false);
    }
  };

  // Approve Recommendation
  const handleApprove = async () => {
    if (!studentId) {
      alert("Please enter a Student ID.");
      return;
    }
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.approveRecommendation(studentId);
      await tx.wait();
      alert("✅ Recommendation approved!");
      fetchStudentDetails(studentId); // Auto-refresh
    } catch (err) {
      console.error("Approve error:", err);
      alert("Approval failed. Ensure you're an authorized approver and request was made.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Student Details
  const fetchStudentDetails = async (id) => {
    if (!id) return;
    try {
      const contract = await getContract();
      const data = await contract.getStudent(id);
      setStudent({
        name: data[0],
        email: data[1],
        course: data[2],
        requested: data[3],
        approved: data[4], // ✅ Correct index from contract
      });
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Student not found or invalid ID.");
      setStudent(null);
    }
  };

  return (
    <div className="container mt-4">
      <div className="text-center mb-4">
        <h2>📚 Letter of Recommendation DApp</h2>
        <p className="text-muted">Manage student recommendations on Sepolia testnet</p>
      </div>

      {/* Wallet Connection */}
      {!currentAccount ? (
        <div className="d-flex justify-content-center mb-4">
          <button className="btn btn-primary btn-lg" onClick={connectWallet}>
            🔌 Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="alert alert-success text-center">
          <strong>Connected:</strong> {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
        </div>
      )}

      {/* Add Student */}
      <div className="card p-3 mb-4">
        <h4 className="mb-3">➕ Add Student</h4>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="form-control"
            />
          </div>
          <div className="col-md-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="form-control"
            />
          </div>
          <div className="col-md-4">
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Course"
              className="form-control"
            />
          </div>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button
            className="btn btn-success"
            onClick={handleAddStudent}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Student"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={authorizeMe}
            disabled={loading}
          >
            {loading ? "Authorizing..." : "Authorize Me as Approver"}
          </button>
        </div>
        <div className="mt-2 text-muted small">
          💡 After adding, use the Student ID below for requests/approvals.
        </div>
      </div>

      {/* Actions */}
      <div className="row g-4">
        {/* Request */}
        <div className="col-md-4">
          <div className="card p-3 h-100">
            <h5 className="text-warning">📝 Request Recommendation</h5>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              className="form-control mb-2"
            />
            <button
              className="btn btn-warning w-100"
              onClick={handleRequest}
              disabled={loading}
            >
              {loading ? "Requesting..." : "Request"}
            </button>
          </div>
        </div>

        {/* Approve */}
        <div className="col-md-4">
          <div className="card p-3 h-100">
            <h5 className="text-info">✅ Approve Recommendation</h5>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              className="form-control mb-2"
            />
            <button
              className="btn btn-info w-100"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>

        {/* Fetch */}
        <div className="col-md-4">
          <div className="card p-3 h-100">
            <h5 className="text-dark">🔍 View Student Details</h5>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              className="form-control mb-2"
            />
            <button
              className="btn btn-dark w-100"
              onClick={() => fetchStudentDetails(studentId)}
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch"}
            </button>
          </div>
        </div>
      </div>

      {/* Student Details */}
      {student && (
        <div className="card p-3 mt-4">
          <h4>👤 Student Details (ID: {studentId})</h4>
          <div className="row">
            <div className="col-md-3">
              <p><strong>Name:</strong> {student.name}</p>
            </div>
            <div className="col-md-3">
              <p><strong>Email:</strong> {student.email}</p>
            </div>
            <div className="col-md-3">
              <p><strong>Course:</strong> {student.course}</p>
            </div>
            <div className="col-md-3">
              <p><strong>Requested:</strong> {student.requested ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Approved:</strong> {student.approved ? "✅ Yes" : "❌ No"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;