import com.mojang.serialization.Codec;

public interface am<T extends an> {
   void a(anb var1, am.a<T> var2);

   void b(anb var1, am.a<T> var2);

   void a(anb var1);

   Codec<T> a();

   default ak<T> a(T $$0) {
      return new ak(this, $$0);
   }

   public static record a<T extends an>(T a, ac b, String c) {
      public a(T param1, ac param2, String param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public void a(anb $$0) {
         $$0.a(this.b, this.c);
      }

      public T a() {
         return this.a;
      }

      public ac b() {
         return this.b;
      }

      public String c() {
         return this.c;
      }
   }
}
