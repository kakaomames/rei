import java.util.Set;

public record aho(int b, chy c, Set<chz> d, boolean e) implements aay<adb> {
   public static final aao<wx, aho> a;

   public aho(int param1, chy param2, Set<chz> param3, boolean param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   public static aho a(int $$0, chy $$1, Set<chz> $$2, boolean $$3) {
      return new aho($$0, $$1, $$2, $$3);
   }

   public aba<aho> a() {
      return ahz.bi;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public chy e() {
      return this.c;
   }

   public Set<chz> f() {
      return this.d;
   }

   public boolean g() {
      return this.e;
   }

   static {
      a = aao.a(aam.h, aho::b, chy.a, aho::e, chz.m, aho::f, aam.b, aho::g, aho::new);
   }
}
