import pandas as pd
import matplotlib
matplotlib.use('Qt5Agg')
import matplotlib.pyplot as plt

df = pd.read_csv('prisons.csv')
print(df.head())

print(df.describe())


df['POPULATION'].plot(kind='hist')
plt.show()