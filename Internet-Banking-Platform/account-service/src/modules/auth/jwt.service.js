const jwt = require("jsonwebtoken");

const config = require("../../config/app.config");

class JwtService {

    /**
     * Generate Access Token.
     */
    generateAccessToken(user) {

        return jwt.sign(
            {
                userId: user._id,
                accountNumber: user.accountNumber,
                clientId: user.clientId,
                username: user.username
            },
            config.jwt.secret,
            {
                expiresIn: config.jwt.accessExpiration
            }
        );

    }

    /**
     * Generate Refresh Token.
     */
    generateRefreshToken(user) {

        return jwt.sign(
            {
                userId: user._id,
                type: "refresh"
            },
            config.jwt.secret,
            {
                expiresIn: config.jwt.refreshExpiration
            }
        );

    }

    /**
     * Generate both tokens.
     */
    generateTokenPair(user) {

        return {

            accessToken:
                this.generateAccessToken(user),

            refreshToken:
                this.generateRefreshToken(user)

        };

    }

    /**
     * Verify JWT.
     */
    verify(token) {

        return jwt.verify(
            token,
            config.jwt.secret
        );

    }

    /**
     * Decode JWT without verification.
     */
    decode(token) {

        return jwt.decode(token);

    }

    /**
     * Extract Bearer token.
     */
    extractToken(header) {

        if (!header) {
            return null;
        }

        if (!header.startsWith("Bearer ")) {
            return null;
        }

        return header.replace(
            "Bearer ",
            ""
        );

    }

}

module.exports = new JwtService();
