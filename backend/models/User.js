const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true},
  password: { type: String, required: true },
  mobile: { type: Number, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  packages: { type: mongoose.Schema.Types.ObjectId, ref: 'Packages', required: true },
  price: { type: Number, required: true },
  paymentoptions: { type: String, enum: ['cash','cheque','online','gpay','phonepe'], required: true },
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  lastLoginSession: { type: String, default: null },
  isDraft: {
        type: Boolean,
        default: false,
        index: true,
  },
  isDeleted: {
  type: Boolean,
  default: false,
  index: true,
},

deletedAt: {
  type: Date,
  default: null,
  index: true,
},

trashExpiresAt: {
  type: Date,
  default: null
},


  myerrors: [
    {
      snippetId: { type: mongoose.Schema.Types.ObjectId, ref: "Snippets" },
      userText: { type: String },

      submittedAt: {
      type: Date,
      default: Date.now,
    },
      capitalSmall: { type: Number, default: 0 },
      punctuation: { type: Number, default: 0 },
      missingExtraWord: { type: Number, default: 0 },
      spelling: { type: Number, default: 0 },
      totalErrorPercentage: { type: Number, default: 0 },

      displayTokens: [
        {
          text: { type: String, default: "" },  
          cls: { type: String, default: "" },  
          tip: { type: String, default: "" },  
        }
      ],

      createdAt: { type: Date, default: Date.now },
      editedAt: { type: Date, default: null }, 
      visibleToUser: { type: Boolean, default: false },
      pageNumber: { type: Number },
    }
  ],


  snippetOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Snippets" }],
  currentIndex: { type: Number, default: 0 },

  isDeclared: { type: Boolean, default: false },
  declaredAt: { type: Date, default: null },
  isComplete: {
    type: Boolean,
    default: true,  // so old users won't break
    index: true,
  },
  softwareUsed: {
    type: Boolean,
    default: false,
    index: true,
  },
  notInSequence: {
    type: Boolean,
    default: false,
    index: true,
  },
});

// Email must be unique only between non-deleted users
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);
UserSchema.index({ isActive: 1, date: 1 });
UserSchema.index({ admin: 1, isActive: 1 });
UserSchema.index({ admin: 1, date: 1 });
UserSchema.index({ packages: 1 });
UserSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 60 * 24 * 60 * 60,
    partialFilterExpression: {
      isDeleted: true,
      deletedAt: { $type: "date" },
    },
  }
);

module.exports = mongoose.model("User", UserSchema);
