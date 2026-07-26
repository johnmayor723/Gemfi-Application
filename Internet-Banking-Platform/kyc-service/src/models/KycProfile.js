const mongoose = require("mongoose");


/**
 * ==========================================================
 * Verification Schema
 * ----------------------------------------------------------
 * Stores verification flags for the customer's KYC journey.
 * ==========================================================
 */
const VerificationSchema = new mongoose.Schema(
    {
        bvnVerified: {
            type: Boolean,
            default: false
        },

        ninVerified: {
            type: Boolean,
            default: false
        },

        photoUploaded: {
            type: Boolean,
            default: false
        },

        signatureUploaded: {
            type: Boolean,
            default: false
        },

        addressVerified: {
            type: Boolean,
            default: false
        },

        creditChecked: {
            type: Boolean,
            default: false
        },

        amlChecked: {
            type: Boolean,
            default: false
        },

        pepChecked: {
            type: Boolean,
            default: false
        },

        sanctionsChecked: {
            type: Boolean,
            default: false
        }

    },
    {
        _id: false
    }
);

/**
 * ==========================================================
 * Identification Schema
 * ----------------------------------------------------------
 * Stores structured identification information.
 * ==========================================================
 */
/**
 * ==========================================================
 * Account Reference Schema
 * ==========================================================
 */
const ReferenceSchema = new mongoose.Schema(
{
    name: {

        type:String,

        required:true

    },

    relationship: {

        type:String,

        default:null

    },

    accountNumber: {

        type:String,

        default:null

    },

    bankName: {

        type:String,

        default:null

    },

    phone: {

        type:String,

        default:null

    },

    email: {

        type:String,

        default:null

    },

    address: {

        type:String,

        default:null

    },

    letterFileId: {

        type:String,

        default:null

    },

    createdAt: {

        type:Date,

        default:Date.now

    },

    updatedAt: {

        type:Date,

        default:null

    }

},
{
    _id:true
});


const IdentificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            default: null
        },

        number: {
            type: String,
            default: null
        },

        expiryDate: {
            type: Date,
            default: null
        },

        createdAt: {
            type: Date,
            default: null
        },

        updatedAt: {
            type: Date,
            default: null
        }

    },
    {
        _id: false
    }
);

/**
 * ==========================================================
 * Next Of Kin Schema
 * ==========================================================
 */
const NextOfKinSchema = new mongoose.Schema(
    {

        name:{
            type:String,
            required:true
        },

        relationship:{
            type:String,
            required:true
        },

        phone:{
            type:String,
            required:true
        },

        email:{
            type:String,
            default:null
        },

        address:{
            type:String,
            default:null
        },

        createdAt:{
            type:Date,
            default:Date.now
        },

        updatedAt:{
            type:Date,
            default:null
        }

    },
    {
        _id:true
    }
);

const AddressSchema = new mongoose.Schema({

    type: String,

    address: String,

    city: String,

    state: String,

    country: String,

    proofFileId: String,

    verified: Boolean,

    verifiedAt: Date

},{
    _id:false
});
/**
 * ==========================================================
 * BVN Schema
 * ==========================================================
 */
const BvnSchema = new mongoose.Schema(
    {
        bvn: String,

        verified: {
            type: Boolean,
            default: false
        },

        firstName: String,

        lastName: String,

        dob: Date,

        phoneNumber: String,

        provider: String,

        verifiedAt: Date

    },
    {
        _id: false
    }
);

/**
 * ==========================================================
 * NIN Schema
 * ==========================================================
 */
const NinSchema = new mongoose.Schema(
    {
        provider: String,

        reference: String,

        verified: {
            type: Boolean,
            default: false
        },

        nin: String,

        firstName: String,

        middleName: String,

        lastName: String,

        dob: Date,

        phoneNumber: String,

        email: String,

        gender: String,

        photo: String,

        verifiedAt: Date

    },
    {
        _id: false
    }
);

/**
 * ==========================================================
 * KYC Profile Schema
 * ==========================================================
 */
const KycProfileSchema = new mongoose.Schema(
    {
        /**
         * Customer Identifier
         */
        customerId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },


        /**
         * Current KYC Tier
         */
        kycLevel: {
            type: String,
            enum: [
                "Tier1",
                "Tier2",
                "Tier3"
            ],
            default: "Tier1"
        },

        /**
         * Overall KYC Status
         */
        status: {
            type: String,
            enum: [
                "Pending",
                "Verified",
                "Rejected"
            ],
            default: "Pending"
        },

        /**
         * Completion Percentage
         *
         * (Calculated by Status Service)
         */
        completion: {
            type: Number,
            default: 0
        },

        /**
         * Customer Identification
         */
        identification: {
            type: IdentificationSchema,
            default: () => ({})
        },
        nextOfKin: [
            {
                type: NextOfKinSchema
            }
        ],
        /**
         * Current Account References
         */
        references:[
            {
                type:ReferenceSchema
            }
        ],
        address: {
            type: AddressSchema,
            default: () => ({})
        },

        /**
         * BVN Information
         */
        bvn: {
            type: BvnSchema,
            default: () => ({})
        },

        /**
         * NIN Information
         */
        nin: {
            type: NinSchema,
            default: () => ({})
        },

        /**
         * Verification Summary
         */
        verification: {
            type: VerificationSchema,
            default: () => ({})
        }

    },
    {
        timestamps: true,
        collection: "kyc_profiles"
    }
);

module.exports =
mongoose.models.KycProfile ||
mongoose.model(
    "KycProfile",
    KycProfileSchema
);