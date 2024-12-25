const mongoose = require("mongoose");
const slugify = require("slugify");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    description: { type: String },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Add pre-save middleware to generate slug
CategorySchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi'
    });
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
