const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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

  myerrors: [
    {
      snippetId: { type: mongoose.Schema.Types.ObjectId, ref: "Snippets" },
      userText: { type: String },

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
});

module.exports = mongoose.model("User", UserSchema);