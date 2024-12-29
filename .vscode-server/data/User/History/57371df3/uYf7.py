import pandas as pd
import matplotlib
import geopandas as gpd
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt

df = pd.read_csv('prisons.csv')
print(df.head())

print(df.info())

print(df.describe())

print(df.isnull().sum())

#Numeric

df['POPULATION'] = pd.to_numeric(df['POPULATION'], errors='coerce')
df['CAPACITY'] = pd.to_numeric(df['CAPACITY'], errors='coerce')
df['SHAPE_Length'] = pd.to_numeric(df['SHAPE_Length'], errors='coerce')
df['SHAPE_Area'] = pd.to_numeric(df['SHAPE_Area'], errors='coerce')

#Dist. of POPULATION

df['POPULATION'].plot(kind='hist', bins=30, color='skyblue', edgecolor='black')
plt.title('Distribution of Population in Prisons')
plt.xlabel('Population')
plt.show()

#Dist. of TYPE

df['TYPE'].value_counts().plot(kind='bar', color='lightgreen')
plt.title('Distribution of Facility Types')
plt.xlabel('Facility Type')
plt.ylabel('Count')
plt.show()

#Dist. of Number of Facilities by State

df['STATE'].value_counts().plot(kind='bar', color='lightcoral')
plt.title('Number of Facilities by State')
plt.xlabel('State')
plt.ylabel('Count')
plt.show()

#Population vs Capacity

df.plot(kind='scatter', x='CAPACITY', y='POPULATION', alpha=0.5, color='green')
plt.title('Population vs Capacity')
plt.xlabel('Capacity')
plt.ylabel('Population')
plt.show()

#CA

correlation = df[['POPULATION', 'CAPACITY', 'SHAPE_Length', 'SHAPE_Area']].corr()

print(correlation)

import seaborn as sns

plt.figure(figsize=(8, 6))
sns.heatmap(correlation, annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Correlation Matrix')
plt.show()


facility_type_stats = df.groupby('TYPE')[['POPULATION', 'CAPACITY']].mean()
print(facility_type_stats)


from sklearn.cluster import KMeans
kmeans = KMeans(n_clusters=3)
df['cluster'] = kmeans.fit_predict(df[['POPULATION', 'CAPACITY', 'SHAPE_Area']])

sns.scatterplot(data=df, x='POPULATION', y='CAPACITY', hue='cluster', palette='viridis')
plt.title('Clustering of Facilities')
plt.show()

gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df['LONGITUDE'], df['LAT']))
print(gdf.head())
