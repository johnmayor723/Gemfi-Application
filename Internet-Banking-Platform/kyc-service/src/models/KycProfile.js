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
        },

        identityVerified: {
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
 * Identity Verification Schema (Didit)
 * ----------------------------------------------------------
 * Tracks the latest Didit hosted-verification session for
 * this customer. decision is the raw V3 decision object as
 * received on the signed webhook - stored as-is rather than
 * re-shaped, since its structure is provider-defined.
 * ==========================================================
 */
const IdentityVerificationSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            default: "didit"
        },

        sessionId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            default: null
        },

        decision: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        createdAt: {
            type: Date,
            default: null
        },

        verifiedAt: {
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
 * Credit Check Schema
 * ==========================================================
 */
const CreditCheckSchema = new mongoose.Schema(
    {
        provider: String,

        reference: String,

        checked: {
            type: Boolean,
            default: false
        },

        score: {
            type: Number,
            default: null
        },

        rating: {
            type: String,
            default: null
        },

        checkedAt: {
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
 * AML Check Schema
 * ==========================================================
 */
const AmlCheckSchema = new mongoose.Schema(
    {
        provider: String,

        reference: String,

        checked: {
            type: Boolean,
            default: false
        },

        matched: {
            type: Boolean,
            default: false
        },

        riskLevel: {
            type: String,
            default: null
        },

        matches: [String],

        checkedAt: {
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
 * PEP Check Schema
 * ==========================================================
 */
const PepCheckSchema = new mongoose.Schema(
    {
        provider: String,

        reference: String,

        checked: {
            type: Boolean,
            default: false
        },

        matched: {
            type: Boolean,
            default: false
        },

        matches: [String],

        checkedAt: {
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
 * Sanctions Check Schema
 * ==========================================================
 */
const SanctionsCheckSchema = new mongoose.Schema(
    {
        provider: String,

        reference: String,

        checked: {
            type: Boolean,
            default: false
        },

        matched: {
            type: Boolean,
            default: false
        },

        lists: [String],

        checkedAt: {
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
        },

        /**
         * Identity Verification (Didit)
         */
        identityVerification: {
            type: IdentityVerificationSchema,
            default: () => ({})
        },

        /**
         * Credit Check
         */
        creditCheck: {
            type: CreditCheckSchema,
            default: () => ({})
        },

        /**
         * AML Screening
         */
        aml: {
            type: AmlCheckSchema,
            default: () => ({})
        },

        /**
         * PEP Screening
         */
        pep: {
            type: PepCheckSchema,
            default: () => ({})
        },

        /**
         * Sanctions Screening
         */
        sanctions: {
            type: SanctionsCheckSchema,
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