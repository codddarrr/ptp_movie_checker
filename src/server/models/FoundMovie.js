import { DataTypes } from 'sequelize';
import sequelize from './database.js';

const FoundMovie = sequelize.define('FoundMovie', {
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
  timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ptp_data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default FoundMovie;
