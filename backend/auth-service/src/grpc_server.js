import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import jwt from 'jsonwebtoken';
import { UserModel as User } from './models/user.model.js';
import { RoleModel as Role } from './models/role.model.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module için __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Proto dosyasını yükle
const PROTO_PATH = path.join(__dirname, './proto/auth.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Token doğrulama fonksiyonu
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// gRPC servis implementasyonu
const authService = {
    // Kullanıcıyı ID ile getir
    GetUserById: async (call, callback) => {
        try {
            const { id, token } = call.request;
            
            // ID validasyonu
            if (!id || id === 'unknown' || id === 'undefined' || id === 'null') {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: 'Invalid user ID provided'
                });
            }

            // ObjectId format kontrolü
            const mongoose = await import('mongoose');
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: 'Invalid ObjectId format'
                });
            }
            
            // Token doğrulama
            const decoded = verifyToken(token);
            if (!decoded) {
                return callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: 'Invalid token'
                });
            }

            // Kullanıcıyı veritabanından getir
            const user = await User.findById(id).populate('role');
            if (!user) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: 'User not found'
                });
            }

            // Response oluştur
            const response = {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    role: {
                        id: user.role._id.toString(),
                        name: user.role.name,
                        description: user.role.description
                    },
                    languagePreference: user.languagePreference || 'tr',
                    isOnline: user.isOnline || false,
                    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null
                },
                success: true,
                message: 'User found successfully'
            };

            callback(null, response);
        } catch (error) {
            console.error('GetUserById error:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error'
            });
        }
    },

    // Kullanıcıyı email ile getir
    GetUserByEmail: async (call, callback) => {
        try {
            const { email, token } = call.request;
            
            // Email validasyonu
            if (!email || email === 'unknown' || email === 'undefined' || email === 'null') {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: 'Invalid email provided'
                });
            }

            // Email format kontrolü
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: 'Invalid email format'
                });
            }
            
            // Token doğrulama
            const decoded = verifyToken(token);
            if (!decoded) {
                return callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: 'Invalid token'
                });
            }

            // Kullanıcıyı veritabanından getir
            const user = await User.findOne({ email }).populate('role');
            if (!user) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: 'User not found'
                });
            }

            // Response oluştur
            const response = {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    role: {
                        id: user.role._id.toString(),
                        name: user.role.name,
                        description: user.role.description
                    },
                    languagePreference: user.languagePreference || 'tr',
                    isOnline: user.isOnline || false,
                    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null
                },
                success: true,
                message: 'User found successfully'
            };

            callback(null, response);
        } catch (error) {
            console.error('GetUserByEmail error:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error'
            });
        }
    },

    // Online customer supporter'ları getir
    GetOnlineCustomerSupporters: async (call, callback) => {
        try {
            // Customer Supporter rolünü bul
            const customerSupporterRole = await Role.findOne({ name: 'Customer Supporter' });
            if (!customerSupporterRole) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: 'Customer Supporter role not found'
                });
            }

            // Online customer supporter'ları getir
            const onlineUsers = await User.find({
                role: customerSupporterRole._id,
                isOnline: true
            }).populate('role');

            // Response oluştur
            const users = onlineUsers.map(user => ({
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: {
                    id: user.role._id.toString(),
                    name: user.role.name,
                    description: user.role.description
                },
                isOnline: user.isOnline,
                lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null
            }));

            const response = {
                users: users,
                success: true,
                message: 'Online customer supporters retrieved successfully'
            };

            callback(null, response);
        } catch (error) {
            console.error('GetOnlineCustomerSupporters error:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error'
            });
        }
    },

    // Token doğrulama
    ValidateToken: async (call, callback) => {
        try {
            const { token } = call.request;
            
            const decoded = verifyToken(token);
            if (!decoded) {
                return callback(null, {
                    valid: false,
                    userId: '',
                    message: 'Invalid token'
                });
            }

            callback(null, {
                valid: true,
                userId: decoded.userId,
                message: 'Token is valid'
            });
        } catch (error) {
            console.error('ValidateToken error:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Internal server error'
            });
        }
    }
};

// gRPC server'ı başlat
function startGrpcServer() {
    const server = new grpc.Server();
    server.addService(authProto.AuthService.service, authService);
    
    const port = process.env.AUTH_GRPC_PORT || 50051;
    const host = process.env.AUTH_GRPC_HOST || '0.0.0.0';
    
    server.bindAsync(
        `${host}:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error('Failed to start gRPC server:', err);
                return;
            }
            console.log(`🚀 gRPC server running on ${host}:${port}`);
            server.start();
        }
    );
}

export { startGrpcServer }; 