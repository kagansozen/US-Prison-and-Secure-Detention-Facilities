import pandas as pd
import matplotlib
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

