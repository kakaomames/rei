import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public record agp(int c, List<ama.c<?>> d) implements aay<adb> {
   public static final aao<xq, agp> a = aay.a(agp::b, agp::new);
   public static final int b = 255;

   private agp(xq $$0) {
      this($$0.l(), a($$0));
   }

   public agp(int param1, List<ama.c<?>> param2) {
      this.c = $$0;
      this.d = $$1;
   }

   private static void a(List<ama.c<?>> $$0, xq $$1) {
      Iterator var2 = $$0.iterator();

      while(var2.hasNext()) {
         ama.c<?> $$2 = (ama.c)var2.next();
         $$2.a($$1);
      }

      $$1.l(255);
   }

   private static List<ama.c<?>> a(xq $$0) {
      ArrayList $$1 = new ArrayList();

      short $$2;
      while(($$2 = $$0.readUnsignedByte()) != 255) {
         $$1.add(ama.c.a($$0, $$2));
      }

      return $$1;
   }

   private void b(xq $$0) {
      $$0.c(this.c);
      a(this.d, $$0);
   }

   public aba<agp> a() {
      return ahz.aK;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.c;
   }

   public List<ama.c<?>> e() {
      return this.d;
   }
}
