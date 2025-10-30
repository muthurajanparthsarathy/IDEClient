"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

// Define test case structure
interface TestCase {
    id: number;
    input: string;
    expected: string;
    description: string;
}

interface TestResult {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    description: string;
    error?: string;
}

export default function Page() {
    const [code, setCode] = useState(
        `# Write your function here
def add(a, b):
    return a + b

# Test your function
if __name__ == "__main__":
    result = add(5, 10)
    print("5")`
    );

    const [output, setOutput] = useState("");
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Test cases that test the actual output (not function calls)
    const [testCases, setTestCases] = useState<TestCase[]>([
        {
            id: 1,
            input: "print_output", // Special marker to run the code and capture output
            expected: "5",
            description: "Should print exactly '5'"
        },
        {
            id: 2,
            input: "add(2, 3)",
            expected: "5",
            description: "Function should return 5 for add(2, 3)"
        },
        {
            id: 3,
            input: "add(-1, 1)",
            expected: "0",
            description: "Function should return 0 for add(-1, 1)"
        }
    ]);

    const runCode = async () => {
        setIsRunning(true);
        setOutput("Running code...");
        setTestResults([]);
        const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

        try {
            const res = await fetch(`https://ideserver-1.onrender.com/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, action: "run" }),
            });

            const data = await res.json();
            if (data.success) {
                setOutput(data.output);
            } else {
                setOutput("Error: " + data.output);
            }
        } catch (error) {
            setOutput("Error: " + (error as Error).message);
        } finally {
            setIsRunning(false);
        }
    };

    const runTests = async () => {
        if (testCases.length === 0) {
            setOutput("Please add at least one test case.");
            return;
        }

        setIsRunning(true);
        setOutput("Running tests...");
        setTestResults([]);
        const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

        try {
            const res = await fetch(`https://ideserver-1.onrender.com/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    testCases,
                    action: "test"
                }),
            });

            const data = await res.json();
            if (data.success) {
                setOutput(data.summary || "Test completed");
                setTestResults(data.results || []);
            } else {
                setOutput("Error: " + data.output);
            }
        } catch (error) {
            setOutput("Error running tests: " + (error as Error).message);
        } finally {
            setIsRunning(false);
        }
    };

    const addTestCase = () => {
        const newTestCase: TestCase = {
            id: Date.now(),
            input: "",
            expected: "",
            description: `Test Case ${testCases.length + 1}`
        };
        setTestCases([...testCases, newTestCase]);
    };

    const updateTestCase = (id: number, field: keyof TestCase, value: string) => {
        setTestCases(testCases.map(tc =>
            tc.id === id ? { ...tc, [field]: value } : tc
        ));
    };

    const removeTestCase = (id: number) => {
        setTestCases(testCases.filter(tc => tc.id !== id));
    };

    const passedTests = testResults.filter(result => result.passed).length;
    const totalTests = testResults.length;

    return (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
            <h2>Python IDE with Test Cases (Docker Execution)</h2>

            {/* Code Editor */}
            <div style={{ marginBottom: 20 }}>
                <h3>Python Code:</h3>
                <Editor
                    height="300px"
                    defaultLanguage="python"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>

            {/* Test Cases Section */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3>Test Cases:</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={addTestCase}
                            style={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontWeight: "bold"
                            }}
                        >
                            + Add Test Case
                        </button>
                        <button
                            onClick={() => {
                                setTestCases([
                                    {
                                        id: 1,
                                        input: "print_output",
                                        expected: "5",
                                        description: "Should print exactly '5'"
                                    }
                                ]);
                            }}
                            style={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                backgroundColor: "#2196F3",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px"
                            }}
                        >
                            Reset to Output Test
                        </button>
                    </div>
                </div>

                {testCases.length === 0 ? (
                    <div style={{
                        border: "2px dashed #ddd",
                        padding: 20,
                        textAlign: "center",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9"
                    }}>
                        No test cases added. Click "Add Test Case" to create one.
                    </div>
                ) : (
                    testCases.map((testCase) => (
                        <div key={testCase.id} style={{
                            border: "1px solid #ddd",
                            padding: 15,
                            marginBottom: 10,
                            borderRadius: "4px",
                            backgroundColor: "#f9f9f9"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <input
                                    type="text"
                                    value={testCase.description}
                                    onChange={(e) => updateTestCase(testCase.id, "description", e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        marginRight: "10px"
                                    }}
                                />
                                <button
                                    onClick={() => removeTestCase(testCase.id)}
                                    style={{
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                        backgroundColor: "#f44336",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "12px"
                                    }}
                                >
                                    Remove
                                </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Input:</label>
                                    <input
                                        type="text"
                                        value={testCase.input}
                                        onChange={(e) => updateTestCase(testCase.id, "input", e.target.value)}
                                        placeholder='Use "print_output" to test main output or function call like "add(2,3)"'
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px"
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>Expected Output:</label>
                                    <input
                                        type="text"
                                        value={testCase.expected}
                                        onChange={(e) => updateTestCase(testCase.id, "expected", e.target.value)}
                                        placeholder="Expected output"
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px"
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: 8, fontSize: "12px", color: "#666" }}>
                                {testCase.input === "print_output"
                                    ? "This test will run your main code and check the printed output"
                                    : "This test will evaluate the function call and check the return value"}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    style={{
                        padding: "12px 24px",
                        cursor: isRunning ? "not-allowed" : "pointer",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        fontSize: "16px"
                    }}
                >
                    {isRunning ? "Running..." : "Run Code"}
                </button>

                <button
                    onClick={runTests}
                    disabled={isRunning || testCases.length === 0}
                    style={{
                        padding: "12px 24px",
                        cursor: (isRunning || testCases.length === 0) ? "not-allowed" : "pointer",
                        backgroundColor: "#FF9800",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        fontSize: "16px"
                    }}
                >
                    {isRunning ? "Testing..." : "Run Tests"}
                </button>
            </div>

            {/* Test Results Summary */}
            {testResults.length > 0 && (
                <div style={{
                    marginBottom: 20,
                    padding: 15,
                    backgroundColor: passedTests === totalTests ? "#e8f5e8" : "#fff3e0",
                    border: `2px solid ${passedTests === totalTests ? "#4CAF50" : "#FF9800"}`,
                    borderRadius: "4px"
                }}>
                    <h3 style={{
                        color: passedTests === totalTests ? "#2e7d32" : "#ef6c00",
                        margin: "0 0 10px 0"
                    }}>
                        Test Summary: {passedTests}/{totalTests} Tests Passed
                    </h3>
                    <div style={{
                        height: "10px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "5px",
                        overflow: "hidden"
                    }}>
                        <div
                            style={{
                                height: "100%",
                                backgroundColor: passedTests === totalTests ? "#4CAF50" : "#FF9800",
                                width: `${(passedTests / totalTests) * 100}%`,
                                transition: "width 0.3s ease"
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Test Results Details */}
            {testResults.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <h3>Test Results:</h3>
                    {testResults.map((result, index) => (
                        <div key={index} style={{
                            padding: 15,
                            marginBottom: 10,
                            border: `2px solid ${result.passed ? "#4CAF50" : "#f44336"}`,
                            borderRadius: "4px",
                            backgroundColor: result.passed ? "#e8f5e8" : "#ffebee"
                        }}>
                            <div style={{
                                fontWeight: "bold",
                                fontSize: "16px",
                                color: result.passed ? "#2e7d32" : "#c62828",
                                marginBottom: 8
                            }}>
                                {result.passed ? "✓ PASS" : "✗ FAIL"}: {result.description}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div>
                                    <strong>Input:</strong>
                                    <div style={{ fontFamily: "monospace", marginTop: 4 }}>
                                        {result.input === "print_output" ? "Run main program" : result.input}
                                    </div>
                                </div>
                                <div>
                                    <strong>Expected:</strong>
                                    <div style={{ fontFamily: "monospace", marginTop: 4 }}>{result.expected}</div>
                                </div>
                                <div>
                                    <strong>Got:</strong>
                                    <div style={{
                                        fontFamily: "monospace",
                                        marginTop: 4,
                                        color: result.passed ? "#2e7d32" : "#c62828"
                                    }}>
                                        {result.actual}
                                    </div>
                                </div>
                            </div>
                            {result.error && (
                                <div style={{
                                    marginTop: 8,
                                    padding: 8,
                                    backgroundColor: "#fff3e0",
                                    border: "1px solid #ffb74d",
                                    borderRadius: "4px",
                                    fontSize: "14px"
                                }}>
                                    <strong>Error:</strong> {result.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Output */}
            <div>
                <h3>Output:</h3>
                <pre style={{
                    backgroundColor: "#1e1e1e",
                    color: "#d4d4d4",
                    padding: 15,
                    border: "1px solid #333",
                    borderRadius: "4px",
                    minHeight: 100,
                    maxHeight: 400,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    fontSize: "14px"
                }}>
                    {output}
                </pre>
            </div>
        </div>
    );
}
