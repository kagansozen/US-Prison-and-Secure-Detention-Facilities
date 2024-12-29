import pandas as pd
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt

df = pd.read_csv('prisons.csv')
print(df.head())

print(df.info())

print(df.describe())

print(df.isnull()).sum()