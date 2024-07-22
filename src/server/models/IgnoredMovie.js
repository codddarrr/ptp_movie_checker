import { DataTypes } from 'sequelize';
import sequelize from './database.js';

const IgnoredMovie = sequelize.define('IgnoredMovie', {
  imdb_url: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      const formattedValue = Array.isArray(value)
        ? value.map(tag => tag.trim())
        : [];
      this.setDataValue('tags', JSON.stringify(formattedValue));
    },
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  akas: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  plotText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  poster_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default IgnoredMovie;
