const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log(email, password);
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            return res.status(409).json({
                status: "error",
                message: "Adresse email non enregistré ou incorrect. Veuillez réessayer.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "error",
                message: "Mot de passe incorrect. Veuillez réessayer.",
            });
        }

        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);

        const adminResponse = {
            email: admin.email,
            token: token,
        };

        res.status(200).json({
            status: "success",
            admin: adminResponse
        })
    } catch (error) {
        console.error(`ERROR LOGIN: ${error}`);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de la connexion.",
        })
    }
};

module.exports = { login };