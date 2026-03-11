// Mock user for testing until the DB is connected
const MOCK_USER = {
    email: "dev@example.com",
    password: "password123"
};

const loginUser = async (email, password) => {
    // Simulate a database lookup
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
        return { id: 1, email: MOCK_USER.email, name: "Test" };
    }

    throw new Error("Invalid credentials");
};

module.exports = { loginUser };