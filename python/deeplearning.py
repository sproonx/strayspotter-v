import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Flatten, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
import os

# 경로 설정
DATASET_PATH = '/Users/kimdajin/Desktop/AI_Deeplearing_Projects/project_4/dataset/train'  # 데이터셋 폴더 (cats, others 포함)
MODEL_PATH = 'cat_classifier_2025_3_8.h5'  # 모델 저장 경로

# 데이터 증강 (Data Augmentation)
datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

# 학습 데이터 & 검증 데이터 생성
train_generator = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary',
    subset='training'
)

val_generator = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary',
    subset='validation'
)

# 클래스 가중치 계산 (고양이 vs 비고양이 데이터 균형 조정)
num_cats = len(os.listdir(os.path.join(DATASET_PATH, "cats")))
num_others = len(os.listdir(os.path.join(DATASET_PATH, "others")))
labels = np.array([0] * num_others + [1] * num_cats)
class_weights = compute_class_weight('balanced', classes=np.unique(labels), y=labels)
class_weight_dict = {0: class_weights[0], 1: class_weights[1]}

print(f'🔹 클래스 가중치: {class_weight_dict}')


# 사전 학습된 모델 로드 (EfficientNetB0)
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Feature Extraction 단계에서는 Freeze

# 커스텀 분류기 추가
model = Sequential([
    base_model,
    Flatten(),
    Dropout(0.5),
    Dense(128, activation='relu'),
    Dense(1, activation='sigmoid')  # Binary Classification (고양이 vs 비고양이)
])

# 모델 컴파일
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Early Stopping 적용 (과적합 방지)
early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

# 모델 학습
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=30,
    class_weight=class_weight_dict,
    callbacks=[early_stopping]
)

# 학습된 모델 저장
model.save(MODEL_PATH)
print(f'✅ Model saved to {MODEL_PATH}')
