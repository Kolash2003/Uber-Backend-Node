const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { user, token } = await authService.register(req.body);
        res.status(201).send({
            data: {
                user,
                token
            },
            success: true,
            error: null,
            message: 'User registered successfully'
        })
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });
        res.status(200).send({
            data: {
                user,
                token
            },
            success: true,
            error: null,
            message: 'User logged in successfully'
        })
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
}

module.exports = { register, login };