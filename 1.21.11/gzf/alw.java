public record alw<T>(int a, alx<T> b) {
   public alw(int param1, alx<T> param2) {
      this.a = $$0;
      this.b = $$1;
   }

   public boolean equals(Object $$0) {
      if (this == $$0) {
         return true;
      } else if ($$0 != null && this.getClass() == $$0.getClass()) {
         alw<?> $$1 = (alw)$$0;
         return this.a == $$1.a;
      } else {
         return false;
      }
   }

   public int hashCode() {
      return this.a;
   }

   public String toString() {
      return "<entity data: " + this.a + ">";
   }

   public int a() {
      return this.a;
   }

   public alx<T> b() {
      return this.b;
   }
}
